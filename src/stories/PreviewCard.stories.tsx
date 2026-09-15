/**
 *
 * This file defines stories for the `PreviewCard` component, showcasing its default behavior
 * and interaction with various props.
 *
 * @module PreviewCardStories
 */

import type { Meta, StoryObj } from "@storybook/react";

import PreviewCard from "../components/PreviewCard";

/**
 * Metadata configuration for the `PreviewCard` component.
 *
 * Specifies the component to be used in the stories and satisfies the `Meta` type.
 *
 * @type {Meta<typeof PreviewCard>}
 */
const meta = {
  component: PreviewCard,
} satisfies Meta<typeof PreviewCard>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Story: `Default`.
 *
 * Displays the default state of the `PreviewCard` component with `selectedRow`
 * and `selectedData` props set to `undefined`.
 *
 * @type {Story}
 */
export const Default: Story = {
  args: {
    clearSelectedData: () => {},
    selectedData: undefined,
  },
};
