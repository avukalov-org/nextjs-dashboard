"use client"

import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/24/outline";
import { OrderBy } from "../lib/definitions";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";

export function OrderByHeader({
  title,
  orderBy
}: {
  title: string,
  orderBy: OrderBy
}) {

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createPageURL = (field: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('orderBy', changeOrderBy(field));
    return `${pathname}?${params.toString()}`;
  };

  function changeOrderBy(field: string) {
    if (orderBy[field] === "desc") {
      return `${field} asc`
    }
    else {
      return `${field} desc`
    }
  }

  const icon =
    orderBy[title] === 'asc' ? (
      <ArrowUpIcon className="w-4 ml-1" />
    ) : (
      <ArrowDownIcon className="w-4 ml-1" />
    );

  return (
    <Link
      href={createPageURL(title)}
      className="flex"
      id={title}
    // onClick={(event) => { handleOnClick(event) }}
    >
      <span className="capitalize">{title}</span>
      {Object.keys(orderBy)[0] == title && icon}
    </Link>
  );
}