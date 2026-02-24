import {subtitle, title} from "@/components/primitives";
import DefaultLayout from "@/layouts/default";

export default function IndexPage() {
    return (
        <DefaultLayout>
            <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
                <div className="inline-block max-w-xl text-center justify-center">
                    <span className={title()}>Say hello to&nbsp;</span>
                    <span className={title({color: "violet"})}>Orbital&nbsp;</span><br/>
                    <div className={subtitle({class: "mt-4"})}>A team first calendar and management app.</div>
                </div>
            </section>
        </DefaultLayout>
    );
}
