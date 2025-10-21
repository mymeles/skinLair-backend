import QRCode from 'qrcode'

export async function generateQRCode(bookingId: string): Promise<string> {
  try {
    // Generate QR code data URL
    const qrCodeDataURL = await QRCode.toDataURL(bookingId, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    
    return qrCodeDataURL
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('Failed to generate QR code')
  }
}

export async function generateQRCodeSVG(bookingId: string): Promise<string> {
  try {
    // Generate QR code as SVG
    const qrCodeSVG = await QRCode.toString(bookingId, {
      type: 'svg',
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    
    return qrCodeSVG
  } catch (error) {
    console.error('Error generating QR code SVG:', error)
    throw new Error('Failed to generate QR code SVG')
  }
}
