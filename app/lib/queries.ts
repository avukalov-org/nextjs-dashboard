// import { gql } from "@apollo/client";

// export const fetchFilteredInvoices() = gql`
// query fetchFilteredInvoices {
//   invoices_customers(limit: 1, offset: 0, where: {_or: [{name: {_ilike: "%08%"}}, {email: {_ilike: "%08%"}}, {amount: {_ilike: "%08%"}}, {date: {_ilike: "%08%"}}, {status: {_ilike: "%08%"}}]}, order_by: {date: asc}) {
//     id
//     amount
//     date
//     status
//     name
//     email
//     image_url
//   }
// }
//`;


// query fetchInvoicesPages {
//   invoices_customers_aggregate(where: {_or: [{name: {_ilike: "%08%"}}, {email: {_ilike: "%08%"}}, {amount: {_ilike: "%08%"}}, {date: {_ilike: "%08%"}}, {status: {_ilike: "%08%"}}]}, order_by: {date: asc})
//   {aggregate{count}}
// }
// const { data } = await getClient().query({ query });
//   console.log(data);