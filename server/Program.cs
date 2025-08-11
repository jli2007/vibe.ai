using dotenv.net;
using server.Services;

// load .env
DotEnv.Load();

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddScoped<ISpotifyService, SpotifyService>();
builder.Services.AddScoped<IOpenAIService, OpenAIService>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowLocalhost3000", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
    options.AddPolicy("AllowLocalhost3001", policy =>
    {
        policy.WithOrigins("http://localhost:3001")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});
// builder.Services.AddScoped<ISpotifyService, SpotifyService>();
var app = builder.Build();

app.UseHttpsRedirection();
app.MapControllers();

app.UseCors("AllowLocalhost3000");
app.UseCors("AllowLocalhost3001");

app.Run();