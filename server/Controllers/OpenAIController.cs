using Microsoft.AspNetCore.Mvc;
using server.Services;

[ApiController]
[Route("api/[controller]")]
public class OpenAIController : ControllerBase
{
    [HttpPost("response")]
    public async Task<IActionResult> GetResponse([FromBody] TokenDTo body)
    {
        var res = await OpenAIService.UseOpenAI(body.text);
        return Ok(res);
    }

    public class TokenDTo
    {
        public string text{ get; set; } = string.Empty;
    }
}