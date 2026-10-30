using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Stockify.Api.Data;
using Stockify.Api.DTOs;
using Stockify.Api.Models;

namespace Stockify.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class StockMutationsController : ControllerBase
{
    private readonly AppDbContext _context;

    public StockMutationsController(AppDbContext context)
    {
        _context = context;
    }

    // GET /api/stockmutations?productId=...
    [HttpGet]
    public async Task<ActionResult<IEnumerable<StockMutationDto>>> GetMutations([FromQuery] int? productId)
    {
        var query = _context.StockMutations
            .Include(m => m.Product)
            .Include(m => m.User)
            .AsQueryable();

        if (productId.HasValue && productId.Value > 0)
        {
            query = query.Where(m => m.ProductId == productId.Value);
        }

        var list = await query
            .OrderByDescending(m => m.CreatedAt)
            .Take(100) // 100 riwayat terbaru
            .Select(m => new StockMutationDto(
                m.Id,
                m.ProductId,
                m.Product != null ? m.Product.Name : "Unknown",
                m.Product != null ? m.Product.SKU : "-",
                m.QuantityChanged,
                m.PreviousStock,
                m.CurrentStock,
                m.Type.ToString(),
                m.Notes,
                m.User != null ? m.User.Username : "System",
                m.CreatedAt
            ))
            .ToListAsync();

        return Ok(list);
    }

    // POST /api/stockmutations (Catat transaksi barang Masuk / Keluar / Koreksi)
    [HttpPost]
    public async Task<ActionResult<StockMutationDto>> CreateMutation([FromBody] CreateStockMutationRequest request)
    {
        var product = await _context.Products.FindAsync(request.ProductId);
        if (product == null)
            return NotFound(new { message = "Produk tidak ditemukan." });

        if (!Enum.TryParse<MutationType>(request.Type, true, out var mutationType))
            return BadRequest(new { message = "Tipe mutasi tidak valid. Pilih: StockIn, StockOut, Adjustment, atau Damaged." });

        // Ambil User ID dari JWT Claim
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdStr, out var userId))
            return Unauthorized(new { message = "User claim tidak valid." });

        int previousStock = product.StockQuantity;
        int delta = 0;

        switch (mutationType)
        {
            case MutationType.StockIn:
                if (request.Quantity <= 0) return BadRequest(new { message = "Jumlah barang masuk harus > 0." });
                delta = request.Quantity;
                break;

            case MutationType.StockOut:
            case MutationType.Damaged:
                if (request.Quantity <= 0) return BadRequest(new { message = "Jumlah barang keluar harus > 0." });
                if (previousStock < request.Quantity)
                    return BadRequest(new { message = $"Stok tidak mencukupi. Sisa stok hanya {previousStock} unit." });
                delta = -request.Quantity;
                break;

            case MutationType.Adjustment:
                // Adjustment: request.Quantity adalah selisih (bisa + atau -)
                if (previousStock + request.Quantity < 0)
                    return BadRequest(new { message = "Penyesuaian stok menghasilkan nilai negatif." });
                delta = request.Quantity;
                break;
        }

        // Update stok produk
        product.StockQuantity = previousStock + delta;
        product.UpdatedAt = DateTime.UtcNow;

        var mutation = new StockMutation
        {
            ProductId = product.Id,
            QuantityChanged = delta,
            PreviousStock = previousStock,
            CurrentStock = product.StockQuantity,
            Type = mutationType,
            Notes = request.Notes ?? string.Empty,
            UserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.StockMutations.Add(mutation);
        await _context.SaveChangesAsync();

        var user = await _context.Users.FindAsync(userId);

        return Ok(new StockMutationDto(
            mutation.Id,
            product.Id,
            product.Name,
            product.SKU,
            mutation.QuantityChanged,
            mutation.PreviousStock,
            mutation.CurrentStock,
            mutation.Type.ToString(),
            mutation.Notes,
            user?.Username ?? "User",
            mutation.CreatedAt
        ));
    }
}

