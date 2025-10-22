#!/usr/bin/env python3
"""
Script simples para gerar ícones PNG para a extensão
"""
import struct
import zlib

def create_png(width, height, color_rgb):
    """Cria um PNG simples com cor sólida"""
    # PNG header
    png_header = b'\x89PNG\r\n\x1a\n'

    # IHDR chunk
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    ihdr_chunk = create_chunk(b'IHDR', ihdr_data)

    # IDAT chunk (image data)
    raw_data = b''
    for y in range(height):
        raw_data += b'\x00'  # filter type
        for x in range(width):
            raw_data += bytes(color_rgb)

    compressed_data = zlib.compress(raw_data, 9)
    idat_chunk = create_chunk(b'IDAT', compressed_data)

    # IEND chunk
    iend_chunk = create_chunk(b'IEND', b'')

    return png_header + ihdr_chunk + idat_chunk + iend_chunk

def create_chunk(chunk_type, data):
    """Cria um chunk PNG"""
    length = struct.pack('>I', len(data))
    crc = zlib.crc32(chunk_type + data) & 0xffffffff
    crc = struct.pack('>I', crc)
    return length + chunk_type + data + crc

# Cores: verde similar ao usado no design
green_rgb = (76, 175, 80)  # #4CAF50

# Gerar ícones
sizes = [16, 48, 128]
for size in sizes:
    png_data = create_png(size, size, green_rgb)
    filename = f'icons/icon{size}.png'
    with open(filename, 'wb') as f:
        f.write(png_data)
    print(f'Criado: {filename}')

print('Ícones gerados com sucesso!')
