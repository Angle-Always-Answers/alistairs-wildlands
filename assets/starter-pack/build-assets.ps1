Add-Type -AssemblyName System.Drawing
$root=$PSScriptRoot
$source=[System.Drawing.Bitmap]::new((Join-Path $root 'atlas-source.png'))
$items=@(
 @('player-idle',0,0,330,410,40,56),@('slime',330,0,300,410,48,32),@('bat',630,0,345,410,64,40),@('training-dummy',975,0,279,410,48,64),
 @('sword',0,410,330,270,64,24),@('pistol',330,410,300,270,48,32),@('hammer',630,410,310,270,64,40),@('axe',940,410,314,270,64,40),
 @('machine-gun',0,680,330,190,64,32),@('shotgun',330,680,300,190,64,24),@('single-shot',630,680,365,190,72,24),@('potion',995,680,259,190,24,32),
 @('ammo',0,870,330,384,32,32),@('grass-dirt',330,870,300,384,48,48),@('woodland-tree',630,870,345,384,128,144),@('background-pine',975,870,279,384,112,144)
)
$manifest=@()
foreach($item in $items){
 $name,$sx,$sy,$sw,$sh,$ow,$oh=$item
 $left=$sx+$sw;$top=$sy+$sh;$right=-1;$bottom=-1
 for($y=$sy;$y -lt $sy+$sh;$y++){for($x=$sx;$x -lt $sx+$sw;$x++){if($source.GetPixel($x,$y).A -gt 16){$left=[Math]::Min($left,$x);$top=[Math]::Min($top,$y);$right=[Math]::Max($right,$x);$bottom=[Math]::Max($bottom,$y)}}}
 $bw=$right-$left+1;$bh=$bottom-$top+1
 $scale=[Math]::Min(($ow-2)/$bw,($oh-2)/$bh)
 $dw=[int][Math]::Round($bw*$scale);$dh=[int][Math]::Round($bh*$scale)
 $dx=[int][Math]::Floor(($ow-$dw)/2);$dy=$oh-1-$dh
 $out=[System.Drawing.Bitmap]::new($ow,$oh,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
 $g=[System.Drawing.Graphics]::FromImage($out)
 $g.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
 $g.PixelOffsetMode=[System.Drawing.Drawing2D.PixelOffsetMode]::Half
 $g.CompositingMode=[System.Drawing.Drawing2D.CompositingMode]::SourceCopy
 $g.DrawImage($source,[System.Drawing.Rectangle]::new($dx,$dy,$dw,$dh),$left,$top,$bw,$bh,[System.Drawing.GraphicsUnit]::Pixel)
 $out.Save((Join-Path $root "$name.png"),[System.Drawing.Imaging.ImageFormat]::Png)
 $g.Dispose();$out.Dispose()
 $manifest+= [ordered]@{name=$name;file="$name.png";width=$ow;height=$oh;anchor=@(($ow/2),($oh-1));sourceRect=@($left,$top,$bw,$bh)}
}
$source.Dispose()
$manifest | ConvertTo-Json -Depth 8 | Set-Content (Join-Path $root 'assets.json')
$preview=[System.Drawing.Bitmap]::new(800,760)
$g=[System.Drawing.Graphics]::FromImage($preview);$g.Clear([System.Drawing.ColorTranslator]::FromHtml('#203b42'))
$g.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$g.PixelOffsetMode=[System.Drawing.Drawing2D.PixelOffsetMode]::Half
$font=[System.Drawing.Font]::new('Consolas',11)
for($i=0;$i -lt $manifest.Count;$i++){
 $m=$manifest[$i];$im=[System.Drawing.Bitmap]::new((Join-Path $root $m.file))
 $scale=[Math]::Min(3,[Math]::Min(180/$m.width,150/$m.height))
 $w=[int]($m.width*$scale);$h=[int]($m.height*$scale);$x=($i%4)*200;$y=[Math]::Floor($i/4)*190
 $g.DrawImage($im,[System.Drawing.Rectangle]::new($x+(200-$w)/2,$y+5+(150-$h)/2,$w,$h))
 $g.DrawString($m.name,$font,[System.Drawing.Brushes]::White,$x+12,$y+160)
 $im.Dispose()
}
$preview.Save((Join-Path $root 'contact-sheet.png'),[System.Drawing.Imaging.ImageFormat]::Png)
$font.Dispose();$g.Dispose();$preview.Dispose()
