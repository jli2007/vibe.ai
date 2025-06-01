using System;
using System.Threading.Tasks;
using SpotifyAPI.Web;

namespace server.Services
{
    public static class SpotifyService
    {
        public static Task<SpotifyClient> GetClientAsync(string AccessToken)
        {
            var spotify = new SpotifyClient(AccessToken);
            return Task.FromResult(spotify);
        }

        public static async Task<PrivateUser> GetCurrentUserProfileAsync(string AccessToken)
        {
            var spotify = await GetClientAsync(AccessToken);
            return await spotify.UserProfile.Current();  // calls SpotifyAPI.Web endpoint
        }
    }
}
