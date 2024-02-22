'use server'

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAccessToken } from "@auth0/nextjs-auth0";
import { gql } from "@apollo/client";
import { getApolloClient } from "./apolloClient";


const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.'
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater then $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.'
  }),
  date: z.string(),
});

// This is temporary until @types/react-dom is updated
export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(prevState: State, formData: FormData) {

  // Tip: If you're working with forms that have many fields,
  // const rawFormData = Object.fromEntries(formData.entries())

  // Validate form fields using Zod
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    }
  }

  // Prepare data for insertion into the database
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD format

  const mutation = gql`
    mutation CreateInvoice(
      $customerId: uuid,
      $amountInCents: Int,
      $status: String,
      $date: date
    ) {
      insert_invoices_one(
        object: {
          customer_id: $customerId,
          amount: $amountInCents,
          status: $status,
          date: $date
        }) {id}
    }`;

  try {
    const { data } = await getApolloClient().getClient()
      .mutate({
        mutation,
        variables: { customerId, amountInCents, status, date }
      });
  } catch (error) {
    return { message: 'Database Error: Failed to Create Invoice.', };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

const UpdateInvoice = FormSchema.omit({ id: true, date: true })

export async function updateInvoice(id: string, prevState: State, formData: FormData) {

  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Invoice.',
    }
  }

  const { customerId, amount, status } = validatedFields.data
  const amountInCents = amount * 100;

  const mutation = gql`
    mutation UpdateInvoice(
      $id: uuid,
      $customerId: uuid,
      $amountInCents: Int,
      $status: String
    ) {
      update_invoices(
        where: {id: {_eq: $id}}, 
        _set: {
          customer_id: $customerId,
          amount: $amountInCents,
          status: $status
        }) {
        affected_rows
      }
    }
  `;
  try {
    const { data } = await getApolloClient().getClient()
      .mutate({
        mutation,
        variables: { id, customerId, amountInCents, status }
      });
  } catch (error) {
    return { message: 'Database Error: Failed to Update Invoice.' };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  // Simulate error debug
  // throw new Error('Failed to Delete Invoice');
  const mutation = gql`
    mutation DeleteInvoice(
      $id: uuid
    ) {
      delete_invoices(
        where: {id: {_eq: $id}}
      ){affected_rows}
    }`;

  try {
    const { data } = await getApolloClient().getClient()
      .mutate({ mutation, variables: { id } });

    revalidatePath('/dashboard/invoices');
    return { message: 'Deleted Invoice.' };
  } catch (error) {
    return { message: 'Database Error: Failed to Delete Invoice.' };
  }
}


export async function getAccessTokenFromAuth0() {
  const { accessToken } = await getAccessToken();
  return accessToken;
}
