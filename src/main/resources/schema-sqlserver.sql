-- RTPlan Database Schema for Microsoft SQL Server
-- Target Database: RTPlan on db1.ads.netyx.net

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'drivers')
BEGIN
    CREATE TABLE drivers (
        DriverID BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        FullName NVARCHAR(150) NOT NULL,
        PhoneNumber NVARCHAR(30) NULL,
        IsActive BIT NOT NULL CONSTRAINT DF_drivers_IsActive DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_drivers_CreatedAt DEFAULT SYSUTCDATETIME()
    );
END;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'route_manifests')
BEGIN
    CREATE TABLE route_manifests (
        ManifestID BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        DriverID BIGINT NOT NULL,
        RouteDate DATE NOT NULL,
        Status VARCHAR(30) NOT NULL CONSTRAINT DF_route_manifests_Status DEFAULT 'PENDING',
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_route_manifests_CreatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_route_manifests_Driver FOREIGN KEY (DriverID) REFERENCES drivers (DriverID)
    );
END;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'route_stops')
BEGIN
    CREATE TABLE route_stops (
        StopID BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        ManifestID BIGINT NOT NULL,
        OriginalExtractedText NVARCHAR(500) NULL,
        CorrectedAddress NVARCHAR(500) NOT NULL,
        IsManuallyEdited BIT NOT NULL CONSTRAINT DF_route_stops_IsManuallyEdited DEFAULT 0,
        Latitude DECIMAL(9,6) NULL,
        Longitude DECIMAL(9,6) NULL,
        OptimizedSequence INT NOT NULL CONSTRAINT DF_route_stops_OptimizedSequence DEFAULT 0,
        CONSTRAINT FK_route_stops_Manifest FOREIGN KEY (ManifestID) REFERENCES route_manifests (ManifestID) ON DELETE CASCADE
    );
    CREATE INDEX IX_route_stops_Manifest_Sequence ON route_stops (ManifestID, OptimizedSequence);
END;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'route_links')
BEGIN
    CREATE TABLE route_links (
        LinkID BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        ManifestID BIGINT NOT NULL,
        SequenceChunk INT NOT NULL,
        GoogleMapsUrl NVARCHAR(2048) NOT NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_route_links_CreatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_route_links_Manifest FOREIGN KEY (ManifestID) REFERENCES route_manifests (ManifestID) ON DELETE CASCADE
    );
    CREATE INDEX IX_route_links_Manifest_Chunk ON route_links (ManifestID, SequenceChunk);
END;
