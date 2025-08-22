using Microsoft.AspNetCore.Mvc;
using server.Services;
using server.DTOs;

// routes to /api/supabase/connect
[ApiController]
[Route("api/[controller]")]
#pragma warning disable CA1050 // Declare types in namespaces
public class SupabaseController : ControllerBase
#pragma warning restore CA1050 // Declare types in namespaces
{
    private readonly ISupabaseService _supabaseService;

    public SupabaseController(ISupabaseService SupabaseService)
    {
        _supabaseService = SupabaseService;
    }

    private string? GetJwtFromRequest()
    {
        var authHeader = Request.Headers["Authorization"].FirstOrDefault();
        if (authHeader != null && authHeader.StartsWith("Bearer "))
        {
            return authHeader.Substring("Bearer ".Length).Trim();
        }
        return null;
    }
        
    // GET: api/supabase/get-messages/{userId}
    [HttpGet("get-messages/{userId}")]
    public async Task<ActionResult<MessagesResponse>> GetMessages(string userId)
    {
        Console.WriteLine("Getting Messages for: " + userId);
        if (string.IsNullOrEmpty(userId))
        {
            return BadRequest(new MessagesResponse
            {
                Success = false,
                Error = "User ID is required"
            });
        }

        var jwt = GetJwtFromRequest();

        // Pass JWT to service
        var result = await _supabaseService.GetUserMessages(userId, jwt);

        
        if (!result.Success)
        {
            return StatusCode(500, result);
        }

        return Ok(result);
    }

    // POST: api/supabase/save-message
    [HttpPost("save-message")]
    public async Task<ActionResult<MessagesResponse>> SaveMessage([FromBody] CreateMessageRequest request)
    {
        Console.WriteLine("Saving Messages for: "+ request.UserId);
        try
        {
            var jwt = GetJwtFromRequest();
            if (string.IsNullOrEmpty(jwt))
            {
                return Unauthorized(new { success = false, error = "JWT token required" });
            }

            var success = await _supabaseService.SaveMessage(request, jwt);

            if (success.Success)
            {
                return Ok(new { success = true, message = "Message saved successfully" });
            }
            else
            {
                return BadRequest(new { success = false, error = "Failed to save message" });
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in SaveMessage: {ex.Message}");
            return StatusCode(500, new { success = false, error = "Internal server error" });
        }
    }

    // DELETE: api/supabase/clear-messages/{userId}
    [HttpDelete("clear-messages/{userId}")]
    public async Task<ActionResult<MessagesResponse>> ClearMessages(string userId)
    {
        Console.WriteLine("Clearing Messages for: "+ userId);
        try
        {
            var jwt = GetJwtFromRequest();
            if (string.IsNullOrEmpty(jwt))
            {
                return Unauthorized(new { success = false, error = "JWT token required" });
            }

            var response = await _supabaseService.ClearUserMessages(userId, jwt);

            if (response.Success)
            {
                return Ok(new
                {
                    success = true,
                });
            }
            else
            {
                return BadRequest(new { success = false, error = "Failed to clear messages" });
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in ClearMessages: {ex.Message}");
            return StatusCode(500, new { success = false, error = "Internal server error" });
        }
    }
}