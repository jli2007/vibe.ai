using System;
using System.Threading.Tasks;
using System.Text.Json; 
using OpenAI;
using OpenAI.Chat;

namespace server.Services
{
    public class PlaylistSpec
    {
        public string? Name { get; set; }               
        public string? Description { get; set; }        
        public string[]? SeedArtists { get; set; }       
        public string[]? SeedTracks { get; set; }
        public string[]? SeedGenres { get; set; }
        public double? TargetTempo { get; set; }
        public double? TargetEnergy { get; set; }
        public double? TargetValence { get; set; }
        public double? TargetDanceability { get; set; }
        public int? Limit { get; set; }
        public string? Market { get; set; }
    }

    public class OpenAIService : IOpenAIService
    {
        private static ChatClient? _client;
        private readonly string _apiKey;
        private readonly string _model;

        public OpenAIService(string? apiKey = null, string? model = null)
        {
            _apiKey = apiKey ?? Environment.GetEnvironmentVariable("OPENAI_KEY") ?? throw new ArgumentNullException("OPENAI_KEY missing");
            _model = model ?? "gpt-4o";
        }

        public Task<ChatClient> GetClientAsync()
        {
            if (_client != null) return Task.FromResult(_client);

            // create instance ChatClient using instance config
            _client = new ChatClient(model: _model, apiKey: _apiKey);
            return Task.FromResult(_client);
        }

        public async Task<ChatCompletion> UseOpenAI(string text)
        {
            var openAI = await GetClientAsync();
            ChatCompletion completion = openAI.CompleteChat(text);
            Console.WriteLine($"[ASSISTANT]: {completion.Content[0].Text}");
            return completion;
        }

        // non-static GeneratePlaylistSpecAsync (identical logic but instance-based)
        public async Task<PlaylistSpec?> GeneratePlaylistSpecAsync(string prompt)
        {
            var client = await GetClientAsync();
            if (client == null) return null;

            var fullPrompt = $@"
            You are to output ONLY valid JSON matching this C# model:
            {{
            ""Name"": ""string"",
            ""Description"": ""string"",
            ""SeedArtists"": [""string""],
            ""SeedTracks"": [""string""],
            ""SeedGenres"": [""string""],
            ""TargetTempo"": 120.0,
            ""TargetEnergy"": 0.5,
            ""TargetValence"": 0.5,
            ""TargetDanceability"": 0.5,
            ""Limit"": 20,
            ""Market"": ""US""
            }}
            User input: ""{prompt}""
            ";

            ChatCompletion? completion;
            try
            {
                completion = client.CompleteChat(fullPrompt); // same call but using instance client
            }
            catch
            {
                return null;
            }

            var json = completion?.Content != null && completion.Content.Count > 0
                ? completion.Content[0].Text?.Trim()
                : null;

            if (string.IsNullOrWhiteSpace(json)) return null;

            try
            {
                return JsonSerializer.Deserialize<PlaylistSpec>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            }
            catch (JsonException)
            {
                var start = json.IndexOf('{');
                var end = json.LastIndexOf('}');
                if (start >= 0 && end > start)
                {
                    var maybeJson = json.Substring(start, end - start + 1);
                    try
                    {
                        return JsonSerializer.Deserialize<PlaylistSpec>(maybeJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    }
                    catch (JsonException)
                    {
                        return null;
                    }
                }

                return null;
            }
        }
    }
}

