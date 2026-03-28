import {subtitle, title} from "@/components/primitives";
import DefaultLayout from "@/layouts/default";
import {useTranslation} from "@/context/TranslationContext";

export default function IndexPage() {
    const {t} = useTranslation();
    
    return (
        <DefaultLayout>
            <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
                <div className="inline-block max-w-xl text-center justify-center">
                    <span className={title({color: "violet"})}>{t("app.name")}&nbsp;</span><br/>
                    <span className={subtitle({class: "mt-4"})}>{t("app.description")}</span>
                </div>
            </section>
        </DefaultLayout>
    );
}
