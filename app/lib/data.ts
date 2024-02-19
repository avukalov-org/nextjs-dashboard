import { sql } from '@vercel/postgres';
import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  User,
  Revenue,
  InvoicesCustomersAggregate,
} from './definitions';
import { formatCurrency } from './utils';
import { unstable_noStore as noStore } from "next/cache";
import { gql } from "@apollo/client";
import { apolloClientAccessToken, apolloClientAdmin } from "./apolloClient";

export async function fetchRevenue() {
  // Add noStore() here to prevent the response from being cached.
  // This is equivalent to in fetch(..., {cache: 'no-store'}).
  noStore();

  try {
    const data = await sql<Revenue>`SELECT * FROM revenue`;

    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestInvoices() {
  noStore();
  const query = gql`
  query fetchLatestInvoices {
    invoices(
      limit: 5,
      order_by: {date: desc}
    ) {
      amount
      id
      customer {
        name
        image_url
        email
      }
    }
  }`;

  try {
    const { data } = await apolloClientAccessToken.getClient().query({ query });

    const invoices: LatestInvoiceRaw[] = data.invoices

    const latestInvoices = invoices.map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));
    return latestInvoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}



export async function fetchCardData() {
  noStore();
  try {
    // You can probably combine these into a single SQL query
    // However, we are intentionally splitting them to demonstrate
    // how to initialize multiple queries in parallel with JS.
    const invoiceCountPromise = sql`SELECT COUNT(*) FROM invoices`;
    const customerCountPromise = sql`SELECT COUNT(*) FROM customers`;
    const invoiceStatusPromise = sql`SELECT
         SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
         SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
         FROM invoices`;

    const data = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      invoiceStatusPromise,
    ]);

    const numberOfInvoices = Number(data[0].rows[0].count ?? '0');
    const numberOfCustomers = Number(data[1].rows[0].count ?? '0');
    const totalPaidInvoices = formatCurrency(data[2].rows[0].paid ?? '0');
    const totalPendingInvoices = formatCurrency(data[2].rows[0].pending ?? '0');

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}



export async function fetchFilteredInvoices(
  search: string,
  currentPage: number,
  itemsPerPage: number = 6,
  orderBy: object = { "date": "desc" }
) {
  noStore();
  const query = gql`
    query fetchFilteredInvoices(
      $search: String,
      $limit: Int,
      $offset: Int,
  		$orderBy: [invoices_customers_order_by!]
    ) {
      invoices_customers(
        where: {
          _or: [
            {name: {_ilike: $search}},
            {email: {_ilike: $search}},
            {amount: {_ilike: $search}},
            {date: {_ilike: $search}},
            {status: {_ilike: $search}}
          ]
        },
        limit: $limit,
        offset: $offset,
        order_by: $orderBy
      ) {
        id
        amount
        date
        status
        name
        email
        image_url
      }
    }
  `;

  const offset = (currentPage - 1) * itemsPerPage;

  try {
    const { data } = await apolloClientAccessToken.getClient()
      .query({
        query,
        variables: {
          search: `%${search}%`,
          limit: itemsPerPage,
          offset,
          orderBy
        }
      });

    return data.invoices_customers as InvoicesTable[];

  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }

}


export async function fetchInvoicesPages(search: string, itemsPerPage: number = 6) {
  noStore();
  const query = gql`
    query fetchInvoicesPages($search: String) {
      invoices_customers_aggregate(
        where: {
          _or: [
            {name: {_ilike: $search}},
            {email: {_ilike: $search}},
            {amount: {_ilike: $search}},
            {date: {_ilike: $search}},
            {status: {_ilike: $search}}
          ]
        }
      ){aggregate{count}}
    }`;

  try {
    const { data } = await apolloClientAccessToken.getClient()
      .query({
        query,
        variables: { search: `%${search}%` }
      });

    const count = (data as InvoicesCustomersAggregate)
      .invoices_customers_aggregate
      .aggregate
      .count

    const totalPages = Math.ceil(Number(count) / itemsPerPage);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id: string) {
  noStore();
  try {
    const data = await sql<InvoiceForm>`
      SELECT
        invoices.id,
        invoices.customer_id,
        invoices.amount,
        invoices.status
      FROM invoices
      WHERE invoices.id = ${id};
    `;

    const invoice = data.rows.map((invoice) => ({
      ...invoice,
      // Convert amount from cents to dollars
      amount: invoice.amount / 100,
    }));

    return invoice[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchCustomers() {
  try {
    const data = await sql<CustomerField>`
      SELECT
        id,
        name
      FROM customers
      ORDER BY name ASC
    `;

    const customers = data.rows;
    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}

export async function fetchFilteredCustomers(query: string) {
  noStore();
  try {
    const data = await sql<CustomersTableType>`
		SELECT
		  customers.id,
		  customers.name,
		  customers.email,
		  customers.image_url,
		  COUNT(invoices.id) AS total_invoices,
		  SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
		  SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
		FROM customers
		LEFT JOIN invoices ON customers.id = invoices.customer_id
		WHERE
		  customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`}
		GROUP BY customers.id, customers.name, customers.email, customers.image_url
		ORDER BY customers.name ASC
	  `;

    const customers = data.rows.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  }
}

export async function getUser(email: string) {
  try {
    const user = await sql`SELECT * FROM users WHERE email=${email}`;
    return user.rows[0] as User;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}
