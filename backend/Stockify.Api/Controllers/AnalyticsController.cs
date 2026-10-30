using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Stockify.Api.Data;
using Stockify.Api.Models;

namespace Stockify.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AnalyticsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _config;

    public AnalyticsController(AppDbContext context, IHttpClientFactory httpClientFactory, IConfiguration config)
    {
        _context = context;
        _httpClientFactory = httpClientFactory;
        _config = config;
    }

    // GET /api/analytics/forecast/{productId}
    [HttpGet("forecast/{productId}")]
    public async Task<IActionResult> GetDemandForecast(int productId)
    {
        var product = await _context.Products.FindAsync(productId);
        if (product == null)
            return NotFound(new { message = "Produk tidak ditemukan." });

        // Ambil riwayat barang keluar (StockOut / Damaged) 14 mutasi terakhir
        var historyData = await _context.StockMutations
            .Where(m => m.ProductId == productId && (m.Type == MutationType.StockOut || m.Type == MutationType.Damaged))
            .OrderByDescending(m => m.CreatedAt)
            .Take(14)
            .Select(m => (double)Math.Abs(m.QuantityChanged))
            .ToListAsync();

        historyData.Reverse(); // Urutkan kronologis

        var mlBaseUrl = _config["MlService:BaseUrl"] ?? "http://ml-service:8000";
        var client = _httpClientFactory.CreateClient();

        var payload = new
        {
            product_id = product.Id,
            product_name = product.Name,
            current_stock = product.StockQuantity,
            sales_history = historyData,
            lead_time_days = 3
        };

        var json = JsonSerializer.Serialize(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        try
        {
            var response = await client.PostAsync($"{mlBaseUrl}/api/predict", content);
            if (!response.IsSuccessStatusCode)
            {
                return StatusCode((int)response.StatusCode, new { message = "Gagal memproses prediksi di ML Engine." });
            }

            var resultJson = await response.Content.ReadAsStringAsync();
            var doc = JsonDocument.Parse(resultJson);
            return Ok(doc.RootElement);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"ML Service tidak dapat dihubungi: {ex.Message}" });
        }
    }
}

