# Builds web-optimised copies of every image into .\img\ (full) and .\img\thumb\.
# Source files in the repo root are the masters and are never modified.
# Re-encoding also strips EXIF, so camera GPS data never reaches the website.
#
# Run this whenever a new artwork photo is added, then reference img\<slug>.jpg.

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root  = $PSScriptRoot
$img   = Join-Path $root 'img'
$thumb = Join-Path $img  'thumb'
New-Item -ItemType Directory -Force $img, $thumb | Out-Null

# source file  ->  output slug
$map = [ordered]@{
  '20260412_170311.jpg'      = 'the-eclipse'
  '20260412_170532.jpg'      = 'violet-metropolis'
  '20260412_170523.jpg'      = 'blood-moon-rising'
  '20260412_170337.jpg'      = 'jade-city'
  '20260412_170613.jpg'      = 'neon-world'
  '20260412_170503.jpg'      = 'ocean-worlds'
  '20260412_170625.jpg'      = 'stellar-drift'
  '20260412_170457.jpg'      = 'silver-planet'
  '20260412_170635.jpg'      = 'gold-and-violet'
  '20260412_170355.jpg'      = 'magenta-veil'
  '20260412_170404.jpg'      = 'emberfall'
  '20260412_170418.jpg'      = 'comet-run'
  '20260412_170443.jpg'      = 'starburst'
  '20260412_170449.jpg'      = 'verdant-giant'
  '20260412_170514.jpg'      = 'cloud-city'
  'Scan_20260412_170545.jpg' = 'neon-skyline'
  'Scan_20260412_170601.jpg' = 'frozen-capital'
  'Scan_20260412_170648.jpg' = 'sister-worlds'
  'Aboutme (2).png'          = 'artist-portrait'
  'Aboutme (1).png'          = 'artist-eclipse-easel'
  '1777747360558.png'        = 'workshop-paints'
  '1777747982340.png'        = 'workshop-easel'
  '1777748232234.png'        = 'workshop-collection'
  '1777748078754.png'        = 'workshop-spray'
  '1777830929609.png'        = 'framed-on-wall'
}

# Scans that came off the scanner on their side. Rotated here rather than in the
# masters, so the originals stay untouched and the fix survives a rebuild.
$rotate = @{
  'neon-skyline'   = 'Rotate90FlipNone'   # 90 degrees clockwise
  'frozen-capital' = 'Rotate90FlipNone'
}

function Save-Jpeg {
    param([System.Drawing.Image]$Src, [int]$MaxEdge, [string]$Out, [int]$Quality)

    $scale = [Math]::Min(1.0, $MaxEdge / [Math]::Max($Src.Width, $Src.Height))
    $w = [int][Math]::Round($Src.Width  * $scale)
    $h = [int][Math]::Round($Src.Height * $scale)

    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g   = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode  = 'HighQualityBicubic'
    $g.PixelOffsetMode    = 'HighQuality'
    $g.SmoothingMode      = 'HighQuality'
    $g.CompositingQuality = 'HighQuality'
    # Flatten onto black so any transparency matches the site background.
    $g.Clear([System.Drawing.Color]::FromArgb(255, 6, 6, 20))
    $g.DrawImage($Src, 0, 0, $w, $h)
    $g.Dispose()

    $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
             Where-Object { $_.MimeType -eq 'image/jpeg' }
    $ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
        [System.Drawing.Imaging.Encoder]::Quality, [int64]$Quality)

    $bmp.Save($Out, $codec, $ep)
    $bmp.Dispose()
    return @{ w = $w; h = $h }
}

$manifest = @()
foreach ($src in $map.Keys) {
    $path = Join-Path $root $src
    if (-not (Test-Path $path)) { Write-Warning "missing: $src"; continue }

    $slug  = $map[$src]
    $image = [System.Drawing.Image]::FromFile($path)
    try {
        if ($rotate.ContainsKey($slug)) { $image.RotateFlip($rotate[$slug]) }

        $f = Save-Jpeg -Src $image -MaxEdge 1800 -Out (Join-Path $img   "$slug.jpg") -Quality 84
        $t = Save-Jpeg -Src $image -MaxEdge 900  -Out (Join-Path $thumb "$slug.jpg") -Quality 80
    } finally { $image.Dispose() }

    $kb = [Math]::Round((Get-Item (Join-Path $img "$slug.jpg")).Length / 1KB)
    $manifest += [pscustomobject]@{
        Slug = $slug; Source = $src
        Full = "$($f.w)x$($f.h)"; Thumb = "$($t.w)x$($t.h)"; FullKB = $kb
    }
}

$manifest | Format-Table -AutoSize
$before = (Get-ChildItem $root -File | Where-Object Extension -in '.jpg','.png' | Measure-Object Length -Sum).Sum
$after  = (Get-ChildItem $img -Recurse -File | Measure-Object Length -Sum).Sum
"masters: {0:N1} MB   web copies: {1:N1} MB" -f ($before/1MB), ($after/1MB)
