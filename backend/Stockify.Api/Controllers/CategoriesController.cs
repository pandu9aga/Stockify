using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Stockify.Api.Data;
using Stockify.Api.DTOs;
using Stockify.Api.Models;

namespace Stockify.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Membutuhkan token JWT yang valid
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext _context;

    public CategoriesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CategoryDto>>> GetCategories()
    {
        var categories = await _context.Categories
            .Select(c => new CategoryDto(c.Id, c.Name, c.Description))
            .ToListAsync();

        return Ok(categories);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CategoryDto>> GetCategory(int id)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null) return NotFound(new { message = "Kategori tidak ditemukan." });

        return Ok(new CategoryDto(category.Id, category.Name, category.Description));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")] // Hanya Admin yang boleh buat kategori
    public async Task<ActionResult<CategoryDto>> CreateCategory([FromBody] CreateCategoryRequest request)
    {
        var category = new Category
        {
            Name = request.Name,
            Description = request.Description
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetCategory), new { id = category.Id },
            new CategoryDto(category.Id, category.Name, category.Description));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        var category = await _context.Categories.Include(c => c.Products).FirstOrDefaultAsync(c => c.Id == id);
        if (category == null) return NotFound(new { message = "Kategori tidak ditemukan." });

        if (category.Products.Any())
            return BadRequest(new { message = "Kategori masih memiliki produk. Hapus atau pindahkan produk terlebih dahulu." });

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}

