# 1. Base Runtime Image untuk menjalankan app
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

# 2. Build Image menggunakan .NET SDK
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["backend/Stockify.Api/Stockify.Api.csproj", "backend/Stockify.Api/"]
RUN dotnet restore "backend/Stockify.Api/Stockify.Api.csproj"
COPY . .
WORKDIR "/src/backend/Stockify.Api"
RUN dotnet build "Stockify.Api.csproj" -c Release -o /app/build

# 3. Publish Image (kompilasi biner optimal)
FROM build AS publish
RUN dotnet publish "Stockify.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# 4. Final Image
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Stockify.Api.dll"]

