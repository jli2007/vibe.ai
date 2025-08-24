using Microsoft.AspNetCore.Mvc;
using server.Services;
using server.DTOS;

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

    // POST: get openai response from prompt
    [HttpPost("response")]
    public async Task<IActionResult> GetResponse([FromBody] TokenDTo body)
    {
        Console.WriteLine($"Body text: {body.AccessToken}");
        var res = await _openAIService.UseOpenAI(body.AccessToken);
        return Ok(res);
    }
}