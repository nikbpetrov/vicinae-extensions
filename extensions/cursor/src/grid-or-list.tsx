import { List, Grid } from "@vicinae/api";
import { layout } from "./preferences";
import { ReactNode } from "react";
import React from "react";

export type ListType = "list";
export type GridType = "grid";

type ListOrGridProps = (List.Props | Grid.Props) & { children?: ReactNode };
export const ListOrGrid: React.FC<ListOrGridProps> = (props) => {
	if (layout === "list") {
		return <List {...(props as List.Props)}>{props.children}</List>;
	} else {
		return <Grid {...(props as Grid.Props)}>{props.children}</Grid>;
	}
};

type ListOrGridSectionProps = (List.Section.Props | Grid.Section.Props) & {
	children?: ReactNode;
};
export const ListOrGridSection: React.FC<ListOrGridSectionProps> = (props) => {
	if (layout === "list") {
		return (
			<List.Section {...(props as List.Section.Props)}>
				{props.children}
			</List.Section>
		);
	} else {
		return (
			<Grid.Section {...(props as Grid.Section.Props)}>
				{props.children}
			</Grid.Section>
		);
	}
};

type ListOrGridItemProps = (List.Item.Props | Grid.Item.Props) & {
	children?: ReactNode;
};
const ListOrGridItemComponent: React.FC<ListOrGridItemProps> = (props) => {
	if (layout === "list") {
		return (
			<List.Item {...(props as List.Item.Props)}>{props.children}</List.Item>
		);
	} else {
		return (
			<Grid.Item {...(props as Grid.Item.Props)}>{props.children}</Grid.Item>
		);
	}
};
ListOrGridItemComponent.displayName = "ListOrGridItem";
export const ListOrGridItem = ListOrGridItemComponent;

type ListOrGridEmptyViewProps = (
	| List.EmptyView.Props
	| Grid.EmptyView.Props
) & { children?: ReactNode };
export function ListOrGridEmptyView(props: ListOrGridEmptyViewProps) {
	if (layout === "list") {
		return (
			<List.EmptyView {...(props as List.EmptyView.Props)}>
				{props.children}
			</List.EmptyView>
		);
	} else {
		return (
			<Grid.EmptyView {...(props as Grid.EmptyView.Props)}>
				{props.children}
			</Grid.EmptyView>
		);
	}
}

type ListOrGridDropdownProps = (List.Dropdown.Props | Grid.Dropdown.Props) & {
	children?: ReactNode;
};
export const ListOrGridDropdown: React.FC<ListOrGridDropdownProps> = (
	props,
) => {
	if (layout === "list") {
		return (
			<List.Dropdown {...(props as List.Dropdown.Props)}>
				{props.children}
			</List.Dropdown>
		);
	} else {
		return (
			<Grid.Dropdown {...(props as Grid.Dropdown.Props)}>
				{props.children}
			</Grid.Dropdown>
		);
	}
};

type ListOrGridDropdownSectionProps = (
	| List.Dropdown.Section.Props
	| Grid.Dropdown.Section.Props
) & { children?: ReactNode };
export const ListOrGridDropdownSection: React.FC<
	ListOrGridDropdownSectionProps
> = (props) => {
	if (layout === "list") {
		return (
			<List.Dropdown.Section {...(props as List.Dropdown.Section.Props)}>
				{props.children}
			</List.Dropdown.Section>
		);
	} else {
		return (
			<Grid.Dropdown.Section {...(props as Grid.Dropdown.Section.Props)}>
				{props.children}
			</Grid.Dropdown.Section>
		);
	}
};

type ListOrGridDropdownItemProps = (
	| List.Dropdown.Item.Props
	| Grid.Dropdown.Item.Props
) & { children?: ReactNode };
const ListOrGridDropdownItemComponent: React.FC<ListOrGridDropdownItemProps> = (
	props,
) => {
	if (layout === "list") {
		return (
			<List.Dropdown.Item {...(props as List.Dropdown.Item.Props)}>
				{props.children}
			</List.Dropdown.Item>
		);
	} else {
		return (
			<Grid.Dropdown.Item {...(props as Grid.Dropdown.Item.Props)}>
				{props.children}
			</Grid.Dropdown.Item>
		);
	}
};
ListOrGridDropdownItemComponent.displayName = "ListOrGridDropdownItem";
export const ListOrGridDropdownItem = ListOrGridDropdownItemComponent;
