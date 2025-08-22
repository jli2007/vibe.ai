namespace server.DTOS
{
    public class TokenDTo
    {
        public string AccessToken { get; set; } = string.Empty;
    }

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
}