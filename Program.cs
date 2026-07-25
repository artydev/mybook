using LiteDB;

var builder = WebApplication.CreateBuilder(args);

// Register LiteDB as a singleton (saves to local file 'blog.db')
builder.Services.AddSingleton<LiteDatabase>(_ => new LiteDatabase("Filename=blog.db;"));

builder.Services.AddCors(options => 
    options.AddDefaultPolicy(policy => policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod())
);

var app = builder.Build();

app.UseCors();

// Enable serving static files from wwwroot (including index.html)
app.UseDefaultFiles();
app.UseStaticFiles();

// 1. Get all posts
app.MapGet("/api/posts", (LiteDatabase db) => {
    var col = db.GetCollection<Post>("posts");
    var posts = col.FindAll().OrderByDescending(p => p.CreatedAt).ToList();
    return Results.Ok(posts);
});

// 2. Create a new post (Status update)
app.MapPost("/api/posts", (Post incoming, LiteDatabase db) => {
    var col = db.GetCollection<Post>("posts");
    incoming.CreatedAt = DateTime.UtcNow;
    col.Insert(incoming);
    return Results.Created($"/api/posts/{incoming.Id}", incoming);
});

// 3. Like a post
app.MapPost("/api/posts/{id}/like", (int id, LiteDatabase db) => {
    var col = db.GetCollection<Post>("posts");
    var post = col.FindById(id);
    if (post == null) return Results.NotFound();

    post.Likes++;
    col.Update(post);
    return Results.Ok(new { post.Likes });
});

// 4. Add a comment to a post
app.MapPost("/api/posts/{id}/comments", (int id, Comment incomingComment, LiteDatabase db) => {
    var col = db.GetCollection<Post>("posts");
    var post = col.FindById(id);
    if (post == null) return Results.NotFound();

    incomingComment.CreatedAt = DateTime.UtcNow;
    post.Comments.Add(incomingComment);
    col.Update(post);
    
    return Results.Ok(post); // Return the updated post
});

app.Run();

// Data Models

