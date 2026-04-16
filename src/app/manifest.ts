import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Good Morning, Nikhil',
    short_name: 'GMN',
    description: 'A personal brand calibration experience',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      {
        src: '/favicon.ico',
        sizes: '16x16 32x32 48x48 64x64',
        type: 'image/x-icon',
      },
    ],
  }
}
