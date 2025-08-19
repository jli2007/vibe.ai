using Microsoft.AspNetCore.Mvc;
using server.Services;

// routes to /api/supabase/connect
[ApiController]
[Route("api/[controller]")]
#pragma warning disable CA1050 // Declare types in namespaces
public class SupabaseController : ControllerBase
#pragma warning restore CA1050 // Declare types in namespaces
{
    private readonly ISupabaseService _SupabaseService; 

    public SupabaseController(ISupabaseService SupabaseService)
    {
        _SupabaseService = SupabaseService;
    }

    // http not required for connection: placeholder for future fns. 
    [HttpGet("connect")]
    public async Task<IActionResult> ConnectClient()
    {
        var client = await _SupabaseService.GetClientAsync();
        return Ok(client);
    }
}