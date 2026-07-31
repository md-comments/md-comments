import os
from PIL import Image, ImageDraw, ImageFont

def draw_text_with_shadow(draw, text, position, font, text_color=(255, 255, 255), shadow_color=(0, 0, 0), offset=(2, 2)):
    x, y = position
    # Draw shadow
    draw.text((x + offset[0], y + offset[1]), text, fill=shadow_color, font=font)
    # Draw text
    draw.text((x, y), text, fill=text_color, font=font)

def draw_text_centered(draw, text, y, font, image_width, text_color=(255, 255, 255), shadow_color=(0, 0, 0), offset=(2, 2)):
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    x = (image_width - text_width) // 2
    draw_text_with_shadow(draw, text, (x, y), font, text_color, shadow_color, offset)

def make_rounded_card(img_path, size, radius=24, border_color=(255, 255, 255, 80), border_width=3):
    # Load and resize
    im = Image.open(img_path).convert("RGBA")
    im = im.resize((size, size), Image.Resampling.LANCZOS)
    
    # Create mask for rounded corners
    mask = Image.new('L', (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle((0, 0, size, size), radius=radius, fill=255)
    
    # Create border image
    border_im = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    border_draw = ImageDraw.Draw(border_im)
    border_draw.rounded_rectangle(
        (border_width//2, border_width//2, size - border_width//2, size - border_width//2),
        radius=radius,
        outline=border_color,
        width=border_width
    )
    
    # Composite the border onto the rounded image
    final_im = Image.composite(im, Image.new('RGBA', (size, size), (0, 0, 0, 0)), mask)
    final_im = Image.alpha_composite(final_im, border_im)
    
    return final_im, mask

def main():
    # Paths
    conv_id = "f4874aa6-2c8b-4f38-bfc2-e93dffe87d39"
    brain_dir = f"/Users/maratstrelets/.gemini/antigravity-ide/brain/{conv_id}"
    bg_path = os.path.join(brain_dir, "cws_bg_1785462540867.png")
    illustration_path = os.path.join(brain_dir, "cws_md_illustration_1785462711079.png")
    
    repo_dir = "/Users/maratstrelets/git/md-comments/md-comments"
    icon_path = os.path.join(repo_dir, "assets/chrome-extension/icon128.png")
    
    out_dir = os.path.join(repo_dir, "assets/chrome-extension")
    small_tile_path = os.path.join(out_dir, "promo-small.png")
    marquee_tile_path = os.path.join(out_dir, "promo-marquee.png")
    
    # Verify input images exist
    for path, name in [(bg_path, "Background"), (illustration_path, "Illustration"), (icon_path, "Icon")]:
        if not os.path.exists(path):
            raise FileNotFoundError(f"{name} image not found at: {path}")
            
    print("Loading assets...")
    bg_img = Image.open(bg_path).convert("RGB")
    icon_img = Image.open(icon_path).convert("RGBA")
    
    # Fonts
    font_regular_path = "/System/Library/Fonts/Supplemental/Arial.ttf"
    font_bold_path = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
    
    # ----------------------------------------------------
    # 1. Generate Small Promo Tile (440x280)
    # ----------------------------------------------------
    print("Generating Small Promo Tile (440x280)...")
    # Crop bg_img to 440:280 ratio (center crop)
    bg_w, bg_h = bg_img.size
    crop_h = int(bg_w * (280 / 440))
    y1 = (bg_h - crop_h) // 2
    y2 = y1 + crop_h
    small_bg = bg_img.crop((0, y1, bg_w, y2)).resize((440, 280), Image.Resampling.LANCZOS)
    
    # Draw onto small tile
    small_draw = ImageDraw.Draw(small_bg)
    
    # Draw logo icon (scale to 80x80)
    icon_small = icon_img.resize((80, 80), Image.Resampling.LANCZOS)
    icon_x = (440 - 80) // 2
    icon_y = 40
    small_bg.paste(icon_small, (icon_x, icon_y), mask=icon_small.split()[3])
    
    # Fonts for small tile
    font_small_title = ImageFont.truetype(font_bold_path, 28)
    font_small_sub = ImageFont.truetype(font_regular_path, 15)
    
    # Title & Subtitle
    draw_text_centered(small_draw, "Markdown Comments", 135, font_small_title, 440)
    draw_text_centered(small_draw, "Interactive collaboration for rendered Markdown", 175, font_small_sub, 440, text_color=(185, 194, 204))
    
    # Save Small Promo Tile (Convert to RGB to make sure no alpha)
    small_bg.convert("RGB").save(small_tile_path, "PNG")
    print(f"Saved Small Promo Tile to: {small_tile_path}")
    
    # ----------------------------------------------------
    # 2. Generate Marquee Promo Tile (1400x560)
    # ----------------------------------------------------
    print("Generating Marquee Promo Tile (1400x560)...")
    # Crop bg_img to 1400:560 (2.5:1) ratio (center crop)
    crop_h_marquee = int(bg_w / 2.5)
    ym1 = (bg_h - crop_h_marquee) // 2
    ym2 = ym1 + crop_h_marquee
    marquee_bg = bg_img.crop((0, ym1, bg_w, ym2)).resize((1400, 560), Image.Resampling.LANCZOS)
    
    # Draw onto marquee tile
    marquee_draw = ImageDraw.Draw(marquee_bg)
    
    # Paste Large Logo (scale to 140x140)
    icon_large = icon_img.resize((140, 140), Image.Resampling.LANCZOS)
    marquee_bg.paste(icon_large, (100, 75), mask=icon_large.split()[3])
    
    # Fonts for marquee tile
    font_marquee_title = ImageFont.truetype(font_bold_path, 64)
    font_marquee_sub1 = ImageFont.truetype(font_bold_path, 24)
    font_marquee_sub2 = ImageFont.truetype(font_regular_path, 20)
    
    # Titles on Left Side
    draw_text_with_shadow(marquee_draw, "Markdown Comments", (100, 240), font_marquee_title)
    draw_text_with_shadow(
        marquee_draw, 
        "Interactive collaboration for Markdown docs.", 
        (100, 335), 
        font_marquee_sub1, 
        text_color=(255, 255, 255)
    )
    draw_text_with_shadow(
        marquee_draw, 
        "Inline comments, threaded replies, and emoji reactions directly on GitHub PRs.", 
        (100, 375), 
        font_marquee_sub2, 
        text_color=(185, 194, 204)
    )
    
    # Paste Illustration Rounded Card on Right Side
    # Size 500x500, centered vertically (y=30)
    card_size = 500
    card_img, card_mask = make_rounded_card(illustration_path, card_size, radius=24, border_color=(255, 255, 255, 90), border_width=3)
    marquee_bg.paste(card_img, (800, 30), mask=card_mask)
    
    # Save Marquee Promo Tile (Convert to RGB to make sure no alpha)
    marquee_bg.convert("RGB").save(marquee_tile_path, "PNG")
    print(f"Saved Marquee Promo Tile to: {marquee_tile_path}")

if __name__ == "__main__":
    main()
