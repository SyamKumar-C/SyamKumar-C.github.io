import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'emptySpace',
})
export class EmptySpacePipe implements PipeTransform {
  transform(value: any): any {
    return value ? value : '-';
  }
}
