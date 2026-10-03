import { ActionForm } from "@/components/admin/action-form";
import { LiveEdit } from "@/components/admin/live-edit";
import { SaveButton } from "@/components/admin/save-button";
import { dress, TypeMenu } from "@/components/admin/type-menu";
import type { Note } from "@/lib/flash";
import type { TextStyle } from "@/lib/type-style";

/**
 * The one set of faces a whole kind of row is written in, at the head of the
 * list of them -- the way the home page has always set every slide alike.
 *
 * Every menu dresses a specimen of its own, so a face is seen before it is
 * saved; where the list below already shows the thing being dressed, `fields`
 * names it too and the whole list turns at once. The form holds nothing but
 * the menus -- what the rows say is written on their own pages.
 */
export interface TypeChoice {
  /** The field the face belongs to, e.g. "styleTitle". */
  name: string;
  style: TextStyle;
  label: string;
  /** A line of the real thing, shown under the menu in the chosen face. */
  sample: string;
  /**
   * What else in the list it dresses, as a selector. Written to include the
   * specimen, which answers to `[data-dress="<name>"]`.
   */
  fields?: string;
}

export function TypeCard({
  action,
  note,
  choices,
  label = "Yazı tipi",
  extra,
}: {
  action: (form: FormData) => Promise<Note>;
  /** What the choice reaches, in a line under the menus. */
  note: string;
  choices: TypeChoice[];
  label?: string;
  /** Another setting the same page keeps, saved by the same button. */
  extra?: React.ReactNode;
}) {
  return (
    <ActionForm action={action} className="adm-card mt-8">
      <LiveEdit>
        <div className="adm-card-head mb-1">
          <span className="label">{label}</span>
        </div>

        <div className="grid gap-x-6 md:grid-cols-2">
          {choices.map(({ name, style, label: menuLabel, sample, fields }) => (
            <div key={name}>
              <TypeMenu
                name={name}
                style={style}
                label={menuLabel}
                fields={fields ?? `[data-dress="${name}"]`}
              />
              <p
                className="mt-2.5 truncate text-[15px] text-mute"
                {...dress(name, style)}
              >
                {sample}
              </p>
            </div>
          ))}
        </div>

        <p className="adm-note mt-5 max-w-[64ch]">{note}</p>

        {extra && <div className="mt-5 border-t border-rule pt-4">{extra}</div>}

        <div className="mt-4">
          <SaveButton />
        </div>
      </LiveEdit>
    </ActionForm>
  );
}
