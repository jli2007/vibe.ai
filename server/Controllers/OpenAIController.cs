using Microsoft.AspNetCore.Mvc;
using server.Services;

[ApiController]
[Route("api/[controller]")]
public class OpenAIController : ControllerBase
{
    // openaiservice is known due to program.cs singleton registration via iopenaiservice.
    private readonly IOpenAIService _openAIService; 

    public OpenAIController(IOpenAIService openAIService)
    {
        _openAIService = openAIService;
    }

    public class TokenDTo
    {
        public string text{ get; set; } = string.Empty;
    }

    [HttpPost("response")]
    public async Task<IActionResult> GetResponse([FromBody] TokenDTo body)
    {
        Console.WriteLine($"Body text: {body.text}");
        var res = await _openAIService.UseOpenAI(body.text);
        return Ok(res);
    }
}