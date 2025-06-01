// todo: create a route to get the users spotifyID via frontend

using Microsoft.AspNetCore.Mvc;
using server.Services;

[ApiController]
[Route("api/[controller]")]
public class SpotifyController : ControllerBase
{
    [HttpPost("profile")]
    public async Task<IActionResult> GetProfile([FromBody] TokenDTo body) // request (JSON) --> TokenDTO object with [FromBody]
    {
        var config = await SpotifyService.GetCurrentUserProfileAsync(body.AccessToken);
        return Ok(config);
    }

    public class TokenDTo
    {
        public string AccessToken { get; set; } = string.Empty;
    }
}