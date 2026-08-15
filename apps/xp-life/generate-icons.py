#!/usr/bin/env python3
"""
Script para gerar ícones PNG a partir de uma base SVG
Requer: pip install pillow cairosvg
"""

try:
    import cairosvg
    from PIL import Image
    import io
    
    # Ler o SVG
    with open('icon.svg', 'rb') as f:
        svg_data = f.read()
    
    # Gerar PNG 512x512
    png_512 = cairosvg.svg2png(bytestring=svg_data, output_width=512, output_height=512)
    with open('icon-512.png', 'wb') as f:
        f.write(png_512)
    print("✅ icon-512.png criado com sucesso!")
    
    # Gerar PNG 192x192
    png_192 = cairosvg.svg2png(bytestring=svg_data, output_width=192, output_height=192)
    with open('icon-192.png', 'wb') as f:
        f.write(png_192)
    print("✅ icon-192.png criado com sucesso!")
    
    print("\n🎉 Ícones gerados com sucesso!")
    print("Próximo passo: Hospedar os arquivos e usar PWA Builder")
    
except ImportError:
    print("⚠️  Bibliotecas não encontradas!")
    print("Instale com: pip install pillow cairosvg")
    print("\nOU use um conversor online:")
    print("1. Acesse: https://cloudconvert.com/svg-to-png")
    print("2. Faça upload do icon.svg")
    print("3. Converta para PNG em 512x512 e 192x192")
except Exception as e:
    print(f"❌ Erro: {e}")
    print("\nAlternativa: Use um conversor online:")
    print("https://cloudconvert.com/svg-to-png")
