import { Component, OnInit } from '@angular/core';
import { Item } from 'src/app/models/item';
import { SearchOutput } from 'src/app/models/search-output';
import { ItemService } from 'src/app/services/item.service';

@Component({
  selector: 'app-items-page',
  templateUrl: './items-page.component.html',
  styleUrls: ['./items-page.component.scss'],
})
export class ItemsPageComponent implements OnInit {
  item: Item = new Item();
  searchText!: string;
  page = 1;
  pageSize = 5;
  searchOutput!: SearchOutput;
  loadMore = true;
  constructor(private itemService: ItemService) {}

  ngOnInit(): void {
    this.searchItems();
  }

  searchWithId() {
    this.itemService.getItemById(this.item.id).subscribe((res: any) => {
      this.item = res.data.findById;
    });
  }

  searchItems() {
    this.page = 1;
    this.itemService
      .searchItems({
        searchText: this.searchText,
        page: 1,
        pageSize: 5,
      })
      .subscribe((res: any) => {
        this.searchOutput = res.data.searchItems;
        this.loadMore = this.searchOutput.items.length === this.pageSize;
      });
  }

  handleScrollDown() {
    console.log('scrolled');
    this.page++;
    if (this.loadMore) {
      this.itemService
        .searchItems({
          searchText: this.searchText,
          page: this.page,
          pageSize: this.pageSize,
        })
        .subscribe((res) => {
          res.data.searchItems.items.map((item: any) => {
            this.searchOutput.items.push(item);
            this.loadMore = res.data.searchItems.items.length === this.pageSize;
          });
        });
    }
  }
}
