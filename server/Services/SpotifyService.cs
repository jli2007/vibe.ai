using System;
using System.Threading.Tasks;
using SpotifyAPI.Web;

namespace server.Services
{
    public static class SpotifyService
    {
        public static Task<SpotifyClient> GetClientAsync()
        {
            var clientId = Environment.GetEnvironmentVariable("SPOTIFY_CLIENTID")!;
            var spotify = new SpotifyClient(clientId);
            return Task.FromResult(spotify);
        }

        public static async Task<PrivateUser> GetCurrentUserProfileAsync()
        {
            var spotify = await GetClientAsync();
            return await spotify.UserProfile.Current(); // calls SpotifyAPI.Web endpoint
        }
    }
}
