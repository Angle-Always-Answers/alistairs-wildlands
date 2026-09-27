Add-Type -AssemblyName System.Drawing
$root=$PSScriptRoot
$src=[System.Drawing.Bitmap]::new((Join-Path $root 'player-animation-source.png'))
$sheet=[System.Drawing.Bitmap]::new(384,320,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g=[System.Drawing.Graphics]::FromImage($sheet)
$g.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$g.PixelOffsetMode=[System.Drawing.Drawing2D.PixelOffsetMode]::Half
$rows=@(@(0,330),@(330,625),@(625,905),@(905,1254))
$columns=@(@(0,330,650,975,1254),@(0,330,678,990,1254),@(0,330,650,975,1254),@(0,330,650,975,1254))
$feet=@(316,604,891,1199)
$centers=@(@(169,482,803,1120),@(171,454,787,1116),@(177,459,770,1116),@(167,491,755,1083))
for($r=0;$r -lt 4;$r++){for($c=0;$c -lt 4;$c++){
 $x=$columns[$r][$c];$y=$rows[$r][0];$w=$columns[$r][$c+1]-$x;$h=$rows[$r][1]-$y
 $dx=[int][Math]::Round($c*96+48+($x-$centers[$r][$c])*.18)
 $dy=[int][Math]::Round($r*80+70+($y-$feet[$r])*.18)
 $g.DrawImage($src,[System.Drawing.Rectangle]::new($dx,$dy,[int][Math]::Round($w*.18),[int][Math]::Round($h*.18)),$x,$y,$w,$h,[System.Drawing.GraphicsUnit]::Pixel)
}}
$sheet.Save((Join-Path $root 'player-animations.png'),[System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose();$src.Dispose();$sheet.Dispose()
@{
 image='player-animations.png';width=384;height=320;frameWidth=96;frameHeight=80;columns=4;anchor=@(48,70);facing='right';weaponsBakedIntoAttackFrames=$true
 animations=@{idle=@{frames=@(0,1);fps=3;loop=$true};run=@{frames=@(2,3);fps=9;loop=$true};sword=@{frames=@(4,5,6,7);durationsMs=@(65,65,75,65);loop=$false};axe=@{frames=@(8,9,10,11);durationsMs=@(120,85,100,125);loop=$false};hammer=@{frames=@(12,13,14,15);durationsMs=@(120,180,150,200);loop=$false}}
} | ConvertTo-Json -Depth 8 | Set-Content (Join-Path $root 'animations.json')
