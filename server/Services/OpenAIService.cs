using System;
using System.Threading.Tasks;
using OpenAI;
using OpenAI.Chat;

namespace server.Services
{
    public static class OpenAIService
    {
        private static ChatClient? _client;
        public static Task<ChatClient> GetClientAsync()
        {
            if (_client != null) return Task.FromResult(_client);

            var key = Environment.GetEnvironmentVariable("OPENAI_KEY");
            _client = new(model: "gpt-4o", apiKey: key);
            
            return Task.FromResult(_client);
        }

        public static async Task<ChatCompletion> UseOpenAI(string text)
        {
            var openAI = await GetClientAsync();
            ChatCompletion completion = openAI.CompleteChat("Say 'this is a test.'");
            Console.WriteLine($"[ASSISTANT]: {completion.Content[0].Text}");
            
            return completion;
        }
    }
}

