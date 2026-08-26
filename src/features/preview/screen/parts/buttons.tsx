import { Repeat } from 'meemaw';

import { Button, type ButtonSize, type ButtonVariant } from '@ui/primitives';

import { Api, Demo, Note, Row, Rule, Section, Specimen, StateCard, StateGrid } from './preview-canvas';

/**
 * Visual spec: design-system/projects/kinnijije-v2/preview/21-button.html
 */

const VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'tertiary'];
const SIZES: ButtonSize[] = ['sm', 'md', 'lg'];

const VARIANT_LABEL: Record<ButtonVariant, string> = {
  primary: 'Suggest meals',
  secondary: 'Something else',
  tertiary: 'Skip for now',
};

const DESTRUCTIVE_LABEL: Record<ButtonVariant, string> = {
  primary: 'Delete account',
  secondary: 'Delete',
  tertiary: 'Remove',
};

export function ButtonsPart() {
  return (
    <Specimen
      title="Button"
      spec="21-button.html"
      description="The base action. Three variants, two independent modifiers, three sizes — and the five escape hatches removed from the shipped API."
    >
      <Rule>
        <b>Three variants and two independent modifiers.</b> Never a flat cross-product: the
        shipped library spelled <code>crit</code> and <code>crit-solid</code> into the variant
        list, which is why there was no destructive tertiary and no on-dark treatment for cook
        mode. <code>destructive</code> and <code>onDark</code> compose with every variant and are
        resolved internally.
      </Rule>

      <Section label="VARIANTS">
        <Demo>
          <Row>
            <Repeat each={VARIANTS}>
              {(variant: ButtonVariant) => (
                <Button key={variant} variant={variant}>
                  {VARIANT_LABEL[variant]}
                </Button>
              )}
            </Repeat>
          </Row>
        </Demo>
      </Section>

      <Section label="× DESTRUCTIVE">
        <Demo>
          <Row>
            <Repeat each={VARIANTS}>
              {(variant: ButtonVariant) => (
                <Button key={variant} variant={variant} destructive>
                  {DESTRUCTIVE_LABEL[variant]}
                </Button>
              )}
            </Repeat>
          </Row>
        </Demo>
        <Note>
          A destructive button is never sky. The modifier re-resolves the ground, the text and the
          border per variant — it does not tint a blue button red.
        </Note>
      </Section>

      <Section label="× ONDARK — cook mode">
        <Demo tone="dark">
          <Row>
            <Button onDark>Next step</Button>
            <Button variant="secondary" onDark>
              Previous
            </Button>
            <Button variant="tertiary" onDark>
              Exit
            </Button>
          </Row>
        </Demo>
        <Note>Cook mode runs on an ink ground — the phone is propped up across the kitchen.</Note>
      </Section>

      <Section label="SIZES">
        <Demo>
          <Row className="items-end">
            <Repeat each={SIZES}>
              {(size: ButtonSize) => (
                <Button key={size} size={size}>
                  {size === 'sm' ? 'Small' : size === 'md' ? 'Medium' : 'Large'}
                </Button>
              )}
            </Repeat>
          </Row>
        </Demo>
        <Note>
          The blade scales with the size — <code>blade-sm</code> at sm, <code>blade-lg</code> at md,{' '}
          <code>blade-xl</code> at lg — so the cut stays proportional to the control.
        </Note>
      </Section>

      <Section label="STATES">
        <Demo>
          <StateGrid>
            <StateCard name="default" when="Ready.">
              <Button icon="bookmarkSave">Save recipe</Button>
            </StateCard>
            <StateCard name="loading" when="Submitting. The label stays — the button never changes width.">
              <Button loading>Save recipe</Button>
            </StateCard>
            <StateCard name="disabled" when="Not available in this context.">
              <Button disabled>Save recipe</Button>
            </StateCard>
            <StateCard name="locked" when="Gated by policy. Tapping explains why.">
              <div className="flex flex-col items-start gap-2">
                <Button variant="secondary">Save recipe</Button>
                <span className="text-xs text-ink-3">Sign in to save</span>
              </div>
            </StateCard>
            <StateCard name="error" when="The action failed; the button returns and the error sits beside it.">
              <div className="flex flex-col items-start gap-2">
                <Button>Save recipe</Button>
                <span className="text-xs font-extrabold text-critical-onsoft">Could not save</span>
              </div>
            </StateCard>
            <StateCard name="fullWidth" when="A dock or a form footer.">
              <Button fullWidth>Suggest meals</Button>
            </StateCard>
          </StateGrid>
        </Demo>
        <Note>
          <b>Loading keeps the label.</b> The shipped AppButton replaced its children with the
          literal string “Loading…”, so the button lost its own name and changed width mid-press.
          Here the spinner swaps the leading icon and nothing else moves.
        </Note>
      </Section>

      <Section label="API">
        <Api>{`<Button variant?="primary|secondary|tertiary" size?="sm|md|lg"
        destructive? onDark? loading? fullWidth? as?="button|a"
        icon? iconEnd? />

// NOT this — the cross product spelled out by hand:
//   variant: "primary" | "crit" | "crit-solid" | "primary-on-dark" | ...
// destructive and onDark COMPOSE with every variant — resolved internally
// no radius / height / padding / textStyle props: every call site would drift
// \`loading\` never replaces children — it swaps the leading icon only`}</Api>
      </Section>
    </Specimen>
  );
}
