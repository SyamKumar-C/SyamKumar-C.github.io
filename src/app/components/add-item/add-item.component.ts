import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Item } from 'src/app/models/item';
import { ItemDto } from 'src/app/models/item-dto';
import { ItemService } from 'src/app/services/item.service';

@Component({
  selector: 'app-add-item',
  templateUrl: './add-item.component.html',
  styleUrls: ['./add-item.component.scss'],
})
export class AddItemComponent implements OnInit {
  constructor(private itemService: ItemService, private router: Router) {}
  item: ItemDto = new Item();
  ngOnInit(): void {}

  addItem() {
    this.itemService.addItem(this.item).subscribe((res) => {
      console.log('item: ', res.data);
      alert('item added successfully with id: ' + res.data);
      this.router.navigate(['/items']);
    });
  }
}
