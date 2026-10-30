using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Stockify.Api.Data;
using Stockify.Api.Models;

namespace Stockify.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")] // Khusus Admin
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;

    public UsersController(AppDbContext context)
    {
        _context = context;
    }

    public record UserDto(int Id, string Username, string Email, string Role, DateTime CreatedAt);
    public record CreateUserRequest(string Username, string Email, string Password, string Role);
    public record UpdateUserRequest(string Email, string Role, string? Password);

    // GET /api/users
    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers()
    {
        var users = await _context.Users
            .OrderBy(u => u.Id)
            .Select(u => new UserDto(u.Id, u.Username, u.Email, u.Role, u.CreatedAt))
            .ToListAsync();

        return Ok(users);
    }

    // POST /api/users
    [HttpPost]
    public async Task<ActionResult<UserDto>> CreateUser([FromBody] CreateUserRequest request)
    {
        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            return BadRequest(new { message = "Email sudah digunakan." });

        if (await _context.Users.AnyAsync(u => u.Username == request.Username))
            return BadRequest(new { message = "Username sudah digunakan." });

        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = string.IsNullOrWhiteSpace(request.Role) ? "Staff" : request.Role,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return Ok(new UserDto(user.Id, user.Username, user.Email, user.Role, user.CreatedAt));
    }

    // PUT /api/users/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserRequest request)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound(new { message = "User tidak ditemukan." });

        if (user.Email != request.Email && await _context.Users.AnyAsync(u => u.Email == request.Email))
            return BadRequest(new { message = "Email sudah digunakan user lain." });

        user.Email = request.Email;
        user.Role = request.Role;

        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        }

        await _context.SaveChangesAsync();
        return NoContent();
    }

    // DELETE /api/users/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound(new { message = "User tidak ditemukan." });

        if (user.Username == "admin")
            return BadRequest(new { message = "Akun super admin utama tidak boleh dihapus!" });

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}

