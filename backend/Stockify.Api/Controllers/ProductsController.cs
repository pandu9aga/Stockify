using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Stockify.Api.Data;
using Stockify.Api.DTOs;
using Stockify.Api.Models;

namespace Stockify.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Semua endpoint butuh login
public class ProductsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ProductsController(AppDbContext context)
    {
        _context = context;
    }

    // GET /api/products?search=...
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductDto>>> GetProducts([FromQuery] string? search)
    {
        var query = _context.Products.Include(p => p.Category).AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(s) || p.SKU.ToLower().Contains(s));
        }

        var products = await query
            .OrderByDescending(p => p.Id)
            .Select(p => new ProductDto(
                p.Id,
                p.Name,
                p.SKU,
                p.Price,
                p.StockQuantity,
                p.CategoryId,
                p.Category != null ? p.Category.Name : null
            ))
            .ToListAsync();

        return Ok(products);
    }

    // GET /api/products/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<ProductDto>> GetProduct(int id)
    {
        var p = await _context.Products.Include(prod => prod.Category).FirstOrDefaultAsync(prod => prod.Id == id);
        if (p == null) return NotFound(new { message = "Produk tidak ditemukan." });

        return Ok(new ProductDto(
            p.Id,
            p.Name,
            p.SKU,
            p.Price,
            p.StockQuantity,
            p.CategoryId,
            p.Category?.Name
        ));
    }

    // POST /api/products (Create)
    [HttpPost]
    public async Task<ActionResult<ProductDto>> CreateProduct([FromBody] CreateProductRequest request)
    {
        if (await _context.Products.AnyAsync(p => p.SKU == request.SKU))
            return BadRequest(new { message = $"SKU '{request.SKU}' sudah terdaftar." });

        var categoryExists = await _context.Categories.AnyAsync(c => c.Id == request.CategoryId);
        if (!categoryExists)
            return BadRequest(new { message = "CategoryId tidak valid." });

        var product = new Product
        {
            Name = request.Name,
            SKU = request.SKU,
            Price = request.Price,
            StockQuantity = request.StockQuantity,
            CategoryId = request.CategoryId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var category = await _context.Categories.FindAsync(product.CategoryId);

        return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, new ProductDto(
            product.Id,
            product.Name,
            product.SKU,
            product.Price,
            product.StockQuantity,
            product.CategoryId,
            category?.Name
        ));
    }

    // PUT /api/products/{id} (Update)
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProduct(int id, [FromBody] UpdateProductRequest request)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound(new { message = "Produk tidak ditemukan." });

        // Cek jika SKU diubah dan bentrok
        if (product.SKU != request.SKU && await _context.Products.AnyAsync(p => p.SKU == request.SKU))
            return BadRequest(new { message = $"SKU '{request.SKU}' sudah digunakan produk lain." });

        var categoryExists = await _context.Categories.AnyAsync(c => c.Id == request.CategoryId);
        if (!categoryExists)
            return BadRequest(new { message = "CategoryId tidak valid." });

        product.Name = request.Name;
        product.SKU = request.SKU;
        product.Price = request.Price;
        product.StockQuantity = request.StockQuantity;
        product.CategoryId = request.CategoryId;
        product.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    // DELETE /api/products/{id} (Delete - Admin Only)
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound(new { message = "Produk tidak ditemukan." });

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}

