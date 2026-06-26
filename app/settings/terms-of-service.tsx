import { View, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowLeft02Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { useLanguageStore } from "@/stores/language-store";
import { Text } from "@/components/ui/text";
import { useThemeColors } from "@/lib/theme";

interface Section {
  title: string;
  body?: string | string[];
  items?: string[];
  subsections?: { title: string; items: string[] }[];
}

const CONTENT: Record<"en" | "ar", { title: string; updated: string; intro: string; sections: Section[]; footer: string }> = {
  en: {
    title: "Terms of Service",
    updated: "Last updated: 26/6/2026",
    intro:
      "Welcome to the Core platform. Please read these Terms and Conditions carefully before using the platform. By using the Core platform, you agree to comply with these Terms and Conditions.",
    footer: "By using the Core platform, you confirm your full acceptance of these Terms and Conditions.",
    sections: [
      {
        title: "1. Definitions",
        items: [
          "Core: An electronic platform that connects customers with various stores to display and sell products and services.",
          "User: Any person who uses the platform, whether as a visitor, customer, or merchant.",
          "Merchant: Any store or institution that displays its products or services through the platform.",
          "Customer: Any user who purchases products or services through the platform.",
        ],
      },
      {
        title: "2. Acceptance of Terms",
        body: [
          "By using the Core platform, you acknowledge that you have read, understood, and fully agreed to these Terms and Conditions.",
          "If you do not agree to any part of these Terms, please do not use the platform.",
        ],
      },
      {
        title: "3. Account Creation",
        body: "The user must:",
        subsections: [
          {
            title: "",
            items: [
              "Provide accurate, complete, and up-to-date information.",
              "Maintain the confidentiality of their login credentials.",
              "Bear full responsibility for all activities that occur through their account.",
            ],
          },
        ],
        items: undefined,
      },
      {
        title: "4. Nature of Service",
        body: [
          "Core operates as an intermediary platform between customers and stores.",
          "Core strives to ensure the quality of services provided; however, responsibility for providing products and fulfilling orders rests with the selling store in accordance with applicable regulations.",
        ],
      },
      {
        title: "5. Orders and Prices",
        items: [
          "All orders are subject to product availability.",
          "Stores have the right to modify or update prices at any time.",
          "The applicable price is the price displayed at the time the order is completed.",
          "An order may be cancelled in the event of a technical error or incorrect information related to the price or product.",
        ],
      },
      {
        title: "6. Payment",
        body: [
          "Core accepts payment methods announced within the platform.",
          "When using electronic payment methods, the user agrees to comply with the payment service provider's terms.",
          "Core reserves the right to suspend or reject any transaction suspected of being fraudulent or illegal.",
        ],
      },
      {
        title: "7. Delivery",
        items: [
          "Delivery times vary depending on location, store, and shipping company.",
          "Core and stores strive to adhere to estimated delivery times.",
          "Core is not responsible for delays resulting from circumstances beyond control, such as weather conditions, security situations, or force majeure.",
        ],
      },
      {
        title: "8. Returns and Refunds",
        body: [
          "Returns and refunds are subject to Core's Returns and Refunds Policy.",
          "A return request may be rejected if the product has been used, damaged, or does not meet the announced return conditions.",
        ],
      },
      {
        title: "9. Prohibited Use",
        body: "Users are prohibited from:",
        subsections: [
          {
            title: "",
            items: [
              "Using the platform for illegal purposes.",
              "Providing misleading or false information.",
              "Attempting to hack the platform or affect its systems.",
              "Misusing payment or shipping services.",
              "Infringing on intellectual property rights or the rights of others.",
            ],
          },
        ],
      },
      {
        title: "10. Intellectual Property",
        body: "All rights related to the platform, including trade name, logo, design, software, and content, are the exclusive property of Core or its licensors and may not be copied or used without prior permission.",
      },
      {
        title: "11. Limitation of Liability",
        body: [
          "Core makes reasonable efforts to ensure the accuracy of information and continuity of service.",
          "However, Core makes no absolute guarantees regarding the platform being free from technical errors, continuity of service without interruption, or the accuracy of all information provided by stores.",
          "In all cases, Core's liability is limited to the extent permitted by law.",
        ],
      },
      {
        title: "12. Account Suspension or Termination",
        body: "Core has the right to suspend or terminate any account in the following cases:",
        subsections: [
          {
            title: "",
            items: [
              "Violation of Terms and Conditions.",
              "Fraud or misuse.",
              "Violation of laws or the rights of others.",
            ],
          },
        ],
      },
      {
        title: "13. Amendment of Terms and Conditions",
        body: [
          "Core reserves the right to amend these Terms and Conditions at any time.",
          "Any amendment becomes effective upon publication on the platform, and continued use of the platform constitutes acceptance of the new amendments.",
        ],
      },
      {
        title: "14. Applicable Law",
        body: [
          "These Terms and Conditions are governed by and interpreted in accordance with the laws of the Hashemite Kingdom of Jordan.",
          "The competent Jordanian courts shall be the competent authority to hear any dispute arising from the use of the platform.",
        ],
      },
      {
        title: "15. Merchant Responsibility and Listed Products",
        body: "Core operates as an intermediary electronic platform connecting customers and stores, and is not considered the owner, manufacturer, or supplier of products listed by stores on the platform unless explicitly stated otherwise.",
        subsections: [
          {
            title: "The merchant alone bears full responsibility for:",
            items: [
              "The accuracy and correctness of product descriptions.",
              "Prices, specifications, and displayed images.",
              "Product availability in inventory.",
              "Product quality and safety.",
              "Compliance with applicable laws and regulations.",
              "Fulfilling and delivering orders according to the announced terms.",
            ],
          },
        ],
        items: undefined,
      },
      {
        title: "",
        body: [
          "Core strives to take appropriate measures to ensure the quality of the user experience, but does not guarantee the accuracy of all information provided by stores.",
          "In the event of a complaint regarding product quality, non-conformity with description, or defect, the selling party bears primary responsibility for handling the complaint in accordance with applicable regulations and platform policies.",
          "Core reserves the right to suspend or remove any store or product that violates platform policies or applicable laws, or negatively affects the user experience.",
        ],
      },
      {
        title: "16. Contact Us",
        body: [
          "For inquiries, complaints, or feedback, please contact us via:",
          "Email:\nPhone:\nWebsite:",
        ],
      },
    ],
  },
  ar: {
    title: "الشروط والأحكام",
    updated: "آخر تحديث: 26/6/2026",
    intro:
      "مرحباً بكم في منصة Core. يرجى قراءة هذه الشروط والأحكام بعناية قبل استخدام المنصة. باستخدامك لمنصة Core فإنك توافق على الالتزام بهذه الشروط والأحكام.",
    footer: "باستخدامك لمنصة Core فإنك تؤكد موافقتك الكاملة على هذه الشروط والأحكام.",
    sections: [
      {
        title: "1. التعريفات",
        items: [
          "Core: منصة إلكترونية تربط بين العملاء والمتاجر المختلفة لعرض وبيع المنتجات والخدمات.",
          "المستخدم: أي شخص يستخدم المنصة سواء كان زائراً أو عميلاً أو تاجراً.",
          "التاجر: أي متجر أو مؤسسة تعرض منتجاتها أو خدماتها عبر المنصة.",
          "العميل: أي مستخدم يقوم بشراء منتجات أو خدمات من خلال المنصة.",
        ],
      },
      {
        title: "2. قبول الشروط",
        body: [
          "باستخدام منصة Core فإنك تقر بأنك قرأت هذه الشروط والأحكام وفهمتها ووافقت عليها بالكامل.",
          "إذا كنت لا توافق على أي جزء من هذه الشروط، يرجى عدم استخدام المنصة.",
        ],
      },
      {
        title: "3. إنشاء الحساب",
        body: "يجب على المستخدم:",
        subsections: [
          {
            title: "",
            items: [
              "تقديم معلومات صحيحة ودقيقة ومحدثة.",
              "الحفاظ على سرية بيانات الدخول الخاصة به.",
              "تحمل المسؤولية الكاملة عن جميع الأنشطة التي تتم من خلال حسابه.",
            ],
          },
        ],
      },
      {
        title: "4. طبيعة الخدمة",
        body: [
          "تعمل Core كمنصة وسيطة بين العملاء والمتاجر.",
          "تسعى Core لضمان جودة الخدمات المقدمة، إلا أن مسؤولية توفير المنتجات وتنفيذ الطلبات تقع على المتجر البائع وفقاً للأنظمة المعمول بها.",
        ],
      },
      {
        title: "5. الطلبات والأسعار",
        items: [
          "تخضع جميع الطلبات لتوفر المنتجات.",
          "يحق للمتجر تعديل الأسعار أو تحديثها في أي وقت.",
          "السعر المعتمد هو السعر الظاهر وقت إتمام الطلب.",
          "قد يتم إلغاء الطلب في حال وجود خطأ تقني أو معلومات غير صحيحة متعلقة بالسعر أو المنتج.",
        ],
      },
      {
        title: "6. الدفع",
        body: [
          "تقبل Core وسائل الدفع التي يتم الإعلان عنها داخل المنصة.",
          "عند استخدام وسائل الدفع الإلكتروني، يوافق المستخدم على الالتزام بشروط مزود خدمة الدفع.",
          "تحتفظ Core بحق تعليق أو رفض أي معاملة يشتبه بكونها احتيالية أو مخالفة للقانون.",
        ],
      },
      {
        title: "7. التوصيل",
        items: [
          "تختلف أوقات التوصيل حسب الموقع الجغرافي والمتجر وشركة الشحن.",
          "تسعى Core والمتاجر إلى الالتزام بالمواعيد المقدرة للتوصيل.",
          "لا تتحمل Core المسؤولية عن التأخير الناتج عن ظروف خارجة عن السيطرة مثل الأحوال الجوية أو الظروف الأمنية أو القوة القاهرة.",
        ],
      },
      {
        title: "8. الإرجاع والاسترداد",
        body: [
          "تخضع عمليات الإرجاع والاسترداد لسياسة الإرجاع والاسترداد الخاصة بمنصة Core.",
          "يجوز رفض طلب الإرجاع إذا تم استخدام المنتج أو إتلافه أو مخالفته لشروط الإرجاع المعلنة.",
        ],
      },
      {
        title: "9. الاستخدام الممنوع",
        body: "يُحظر على المستخدم:",
        subsections: [
          {
            title: "",
            items: [
              "استخدام المنصة لأغراض غير قانونية.",
              "تقديم معلومات مضللة أو مزيفة.",
              "محاولة اختراق المنصة أو التأثير على أنظمتها.",
              "إساءة استخدام خدمات الدفع أو الشحن.",
              "انتهاك حقوق الملكية الفكرية أو حقوق الآخرين.",
            ],
          },
        ],
      },
      {
        title: "10. الملكية الفكرية",
        body: "جميع الحقوق المتعلقة بالمنصة بما في ذلك الاسم التجاري والشعار والتصميم والبرمجيات والمحتوى هي ملك حصري لـ Core أو للجهات المرخصة لها، ولا يجوز نسخها أو استخدامها دون إذن مسبق.",
      },
      {
        title: "11. حدود المسؤولية",
        body: [
          "تبذل Core جهداً معقولاً لضمان دقة المعلومات واستمرارية الخدمة.",
          "ومع ذلك، لا تقدم Core أي ضمانات مطلقة بشأن خلو المنصة من الأخطاء التقنية أو استمرارية الخدمة دون انقطاع أو دقة جميع المعلومات المقدمة من المتاجر.",
          "وفي جميع الأحوال تكون مسؤولية Core محدودة بالحد الذي يسمح به القانون.",
        ],
      },
      {
        title: "12. تعليق أو إنهاء الحساب",
        body: "يحق لـ Core تعليق أو إنهاء أي حساب في الحالات التالية:",
        subsections: [
          {
            title: "",
            items: [
              "مخالفة الشروط والأحكام.",
              "الاحتيال أو إساءة الاستخدام.",
              "انتهاك القوانين أو حقوق الآخرين.",
            ],
          },
        ],
      },
      {
        title: "13. تعديل الشروط والأحكام",
        body: [
          "تحتفظ Core بحق تعديل هذه الشروط والأحكام في أي وقت.",
          "يصبح أي تعديل نافذاً بمجرد نشره على المنصة، ويُعد استمرار استخدام المنصة موافقة على التعديلات الجديدة.",
        ],
      },
      {
        title: "14. القانون المعمول به",
        body: [
          "تخضع هذه الشروط والأحكام وتفسر وفقاً لقوانين المملكة الأردنية الهاشمية.",
          "وتكون المحاكم الأردنية المختصة هي الجهة المختصة بالنظر في أي نزاع ينشأ عن استخدام المنصة.",
        ],
      },
      {
        title: "15. مسؤولية التاجر والمنتجات المعروضة",
        body: "تعمل Core كمنصة إلكترونية وسيطة تربط بين العملاء والمتاجر، ولا تعتبر مالكة أو مصنعة أو موردة للمنتجات المعروضة من قبل المتاجر على المنصة ما لم يتم التصريح بخلاف ذلك.",
        subsections: [
          {
            title: "يتحمل التاجر وحده المسؤولية الكاملة عن:",
            items: [
              "صحة ودقة أوصاف المنتجات.",
              "الأسعار والمواصفات والصور المعروضة.",
              "توفر المنتجات في المخزون.",
              "جودة المنتجات وسلامتها.",
              "الالتزام بالقوانين والأنظمة المعمول بها.",
              "تنفيذ الطلبات وتسليمها وفق الشروط المعلنة.",
            ],
          },
        ],
        items: undefined,
      },
      {
        title: "",
        body: [
          "وتسعى Core إلى اتخاذ الإجراءات المناسبة لضمان جودة تجربة المستخدم، إلا أنها لا تضمن صحة جميع المعلومات المقدمة من المتاجر.",
          "وفي حال وجود شكوى تتعلق بجودة المنتج أو مخالفته للوصف أو وجود عيب فيه، تتحمل الجهة البائعة المسؤولية الأساسية عن معالجة الشكوى وفق الأنظمة المعمول بها وسياسات المنصة.",
          "وتحتفظ Core بحق تعليق أو إزالة أي متجر أو منتج يخالف سياسات المنصة أو القوانين النافذة أو يؤثر سلباً على تجربة المستخدم.",
        ],
      },
      {
        title: "16. التواصل معنا",
        body: [
          "للاستفسارات أو الشكاوى أو الملاحظات، يرجى التواصل عبر:",
          "البريد الإلكتروني:\nرقم الهاتف:\nالموقع الإلكتروني:",
        ],
      },
    ],
  },
};

export default function TermsOfService() {
  const router = useRouter();
  const c = useThemeColors();
  const { language } = useLanguageStore();
  const isAr = language === "ar";
  const BackIcon = isAr ? ArrowRight01Icon : ArrowLeft02Icon;
  const content = CONTENT[isAr ? "ar" : "en"];

  return (
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark">
      <View className="flex-row items-center gap-3 px-4 pb-3 pt-2">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-bg-card"
        >
          <HugeiconsIcon icon={BackIcon} size={22} color={c.brand} />
        </Pressable>
        <Text variant="bold" className="text-xl text-brand dark:text-white">
          {content.title}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 48 }}
      >
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text
            className="mb-4 text-xs"
            style={{ color: c.muted, textAlign: isAr ? "right" : "left" }}
          >
            {content.updated}
          </Text>

          <View className="mb-6 rounded-xl bg-white dark:bg-bg-card p-4">
            <Text
              className="text-sm leading-6"
              style={{ color: c.secondary, textAlign: isAr ? "right" : "left" }}
            >
              {content.intro}
            </Text>
          </View>

          {content.sections.map((section, i) => (
            <View key={i} className="mb-4 rounded-xl bg-white dark:bg-bg-card p-4">
              <Text
                variant="bold"
                className="mb-3 text-sm text-brand dark:text-white"
                style={{ textAlign: isAr ? "right" : "left" }}
              >
                {section.title}
              </Text>

              {section.body ? (
                Array.isArray(section.body) ? (
                  section.body.map((paragraph, j) => (
                    <Text
                      key={j}
                      className="mb-2 text-sm leading-6"
                      style={{ color: c.secondary, textAlign: isAr ? "right" : "left" }}
                    >
                      {paragraph}
                    </Text>
                  ))
                ) : (
                  <Text
                    className="mb-2 text-sm leading-6"
                    style={{ color: c.secondary, textAlign: isAr ? "right" : "left" }}
                  >
                    {section.body}
                  </Text>
                )
              ) : null}

              {section.items ? (
                <View className="mt-1">
                  {section.items.map((item, j) => (
                    <View
                      key={j}
                      className="mb-1.5 flex-row items-start gap-2"
                      style={{ flexDirection: isAr ? "row-reverse" : "row" }}
                    >
                      <View
                        className="mt-2 h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: c.secondary }}
                      />
                      <Text
                        className="flex-1 text-sm leading-6"
                        style={{ color: c.secondary, textAlign: isAr ? "right" : "left" }}
                      >
                        {item}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {section.subsections?.map((sub, j) => (
                <View key={j} className="mt-2">
                  {sub.title ? (
                    <Text
                      variant="semibold"
                      className="mb-2 text-xs text-brand dark:text-white"
                      style={{ textAlign: isAr ? "right" : "left" }}
                    >
                      {sub.title}
                    </Text>
                  ) : null}
                  {sub.items.map((item, k) => (
                    <View
                      key={k}
                      className="mb-1.5 flex-row items-start gap-2"
                      style={{ flexDirection: isAr ? "row-reverse" : "row" }}
                    >
                      <View
                        className="mt-2 h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: c.secondary }}
                      />
                      <Text
                        className="flex-1 text-sm leading-6"
                        style={{ color: c.secondary, textAlign: isAr ? "right" : "left" }}
                      >
                        {item}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ))}

          <View
            className="rounded-xl p-4"
            style={{ backgroundColor: c.brandLight }}
          >
            <Text
              className="text-xs leading-5"
              style={{ color: c.secondary, textAlign: isAr ? "right" : "left" }}
            >
              {content.footer}
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
