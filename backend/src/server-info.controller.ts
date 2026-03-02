import { Controller, Get, Logger } from '@nestjs/common';
import { networkInterfaces } from 'os';

@Controller('server-info')
export class ServerInfoController {
  private readonly logger = new Logger('ServerInfo');

  @Get()
  getServerInfo() {
    const publicUrl = process.env.PUBLIC_BASE_URL;

    const nets = networkInterfaces();
    let localIp = '127.0.0.1';

    for (const ifaces of Object.values(nets)) {
      if (!ifaces) continue;
      for (const info of ifaces) {
        if (info.family === 'IPv4' && !info.internal) {
          localIp = info.address;
          break;
        }
      }
      if (localIp !== '127.0.0.1') break;
    }

    const port = process.env.PORT || 3000;
    const baseUrl = publicUrl || `http://${localIp}:${port}`;

    if (!publicUrl) {
      this.logger.warn(
        `PUBLIC_BASE_URL not set. QR codes will use LAN IP: ${baseUrl}. ` +
        `Set PUBLIC_BASE_URL in .env for cross-network access.`,
      );
    }

    return { baseUrl, ip: localIp, port: Number(port), isPublic: !!publicUrl };
  }
}
