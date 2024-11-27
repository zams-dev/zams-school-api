import { PipeTransform, Injectable, BadRequestException } from "@nestjs/common";

@Injectable()
export class PaginationParseQueryParamsPipe implements PipeTransform {
  transform(value: any) {
    try {
      if (value.order) {
        value.order = JSON.parse(value.order); // Transform `order` to an object
      }

      if (value.columnDef) {
        value.columnDef = JSON.parse(value.columnDef); // Transform `columnDef` to an array of objects
      }

      return value;
    } catch (error) {
      throw new BadRequestException("Invalid query parameter format");
    }
  }
}
