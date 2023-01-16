import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { environment as env } from 'src/environments/environment';
import { Apollo } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { InMemoryCache } from '@apollo/client/core';

@NgModule({
  declarations: [],
  imports: [CommonModule, HttpClientModule],
})
export class GraphqlModule {
  private readonly ITEM_URI = env.hotelUrl;
  constructor(apollo: Apollo, httpLink: HttpLink) {
    apollo.createDefault({
      cache: new InMemoryCache({
        addTypename: false,
      }),
      link: httpLink.create({
        uri: this.ITEM_URI,
      }),
      defaultOptions: {
        query: {
          fetchPolicy: 'no-cache',
        },
        watchQuery: {
          fetchPolicy: 'no-cache',
        },
      },
    });
  }
}
