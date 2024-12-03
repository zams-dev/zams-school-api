import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Res,
} from "@nestjs/common";
import path, { join } from "path";
import { Response } from "express";
import { ApiTags } from "@nestjs/swagger";
import axios from "axios";
@ApiTags("public")
@Controller("public")
export class PublicController {
  constructor() {}
  // Serve the image from the uploads folder
  @Get("static/images/:imgpath")
  seePublicImages(@Param("imgpath") image: string, @Res() res: Response) {
    const path = join(process.cwd(), "src/public/images", image);
    console.log(path);
    return res.sendFile(path);
  }
  // Serve the image from the uploads folder
  @Get("static/assets/:fileName")
  seeAssets(@Param("fileName") image: string, @Res() res: Response) {
    const path = join(process.cwd(), "src/public/assets", image);
    console.log(path);
    return res.sendFile(path);
  }
  // Serve the image from the uploads folder
  @Get(":url")
  async getURLFileContent(@Param("url") url: string, @Res() res: Response) {
    const stringContent = await this.fetchFileContent(url);
    return res.send(stringContent);
  }

  /**
   * Fetches the content of a remote file via URL.
   * @param url - The URL of the remote file.
   * @returns The content of the remote file as a string.
   */
  async fetchFileContent(url: string): Promise<string> {
    try {
      // Validate the URL
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        throw new BadRequestException("Invalid URL");
      }

      const response = await axios.get(url, {
        responseType: "text", // Ensure we receive the response as plain text
      });

      return response.data;
    } catch (error) {
      throw new Error(
        `Error fetching remote file: ${
          error.response?.statusText || error.message
        }`
      );
    }
  }
}
