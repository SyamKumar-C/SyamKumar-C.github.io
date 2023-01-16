import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { environment } from 'src/environments/environment';
import { Item } from '../models/item';
import { ItemDto } from '../models/item-dto';
import { SearchOutput } from '../models/search-output';

@Injectable({
  providedIn: 'root',
})
export class ItemService {
  // to solve No Provider for Apollo, declare ApolloModule, HttpLinkModule, HttpClientModule in application.module.ts

  apiUrl: string = environment.hotelUrl;

  constructor(private apollo: Apollo) {}

  getItems() {
    return this.apollo.watchQuery<{
      findAll: Item[];
    }>({
      query: gql`
        query findAll {
          findAll {
            id
            itemName
            price
          }
        }
      `,
    }).valueChanges;
  }

  getItemById(id: any) {
    return this.apollo.watchQuery<{ findById: Item }>({
      query: gql`
        query findById${id} ($id: Int!) {
          findById(id: $id){
            id
            itemName
            price
          }
        }
      `,
      variables: { id },
    }).valueChanges;
  }

  searchItems(searchInput: any) {
    return this.apollo.watchQuery<{ searchItems: SearchOutput }>({
      query: gql`
        query ($searchInput: SearchInput) {
          searchItems(searchInput: $searchInput) {
            items {
              id
              itemName
              price
            }
            count
          }
        }
      `,
      variables: { searchInput },
    }).valueChanges;
  }

  addItem(item: ItemDto) {
    return this.apollo.mutate({
      mutation: gql`
        mutation ($item: ItemDto) {
          addItem(item: $item) {
            id
            itemName
            price
          }
        }
      `,
      variables: { item },
      // refetchQueries: [`searchItems`]
    });
  }
}

const getItemDetail = (id: number) => gql`
  query findById($id: number) {
    findById(id: $id) {
      id
      itemName
      price
    }
  }
`;
