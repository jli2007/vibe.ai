// todo: create a route to get the users spotifyID via frontend

using Microsoft.AspNetCore.Mvc;
using server.Services;

[ApiController]
[Route("api/[controller]")]
public class SpotifyController : ControllerBase
{
    public class TokenDTo
    {
        public string AccessToken { get; set; } = string.Empty;
    }
    
    // POST: get user spotify profile
    [HttpPost("profile")]
    public async Task<IActionResult> GetProfile([FromBody] TokenDTo body) // request (JSON) --> TokenDTO object with [FromBody]
    {
        var spotifyService = new SpotifyService();
        var config = await spotifyService.GetCurrentUserProfileAsync(body.AccessToken);
        return Ok(config);
    }
}