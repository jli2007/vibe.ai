using Microsoft.AspNetCore.Mvc;
using server.Services;

// routes to /api/supabase/connect
[ApiController]
[Route("api/[controller]")]
#pragma warning disable CA1050 // Declare types in namespaces
public class SupabaseController : ControllerBase
#pragma warning restore CA1050 // Declare types in namespaces
{
    // http not required, placeholder
    [HttpGet("connect")]
    public async Task<IActionResult> ConnectClient()
    {
        var client = await SupabaseClientService.GetClientAsync();
        return Ok(client);
    }
}