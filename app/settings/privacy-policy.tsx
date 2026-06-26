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
  body: string | string[];
  subsections?: { title: string; items: string[] }[];
}

const CONTENT: Record<"en" | "ar", { title: string; updated: string; intro: string; sections: Section[] }> = {
  en: {
    title: "Privacy Policy",
    updated: "Last updated: 25/6/2026",
    intro:
      "Welcome to Core. We are committed to protecting our users' privacy and ensuring their personal data is handled with the highest levels of security and transparency. This policy explains how information is collected, used, and protected when using the Core platform.",
    sections: [
      {
        title: "1. Who We Are",
        body: "Core is an e-commerce marketplace platform that connects users with various stores, allowing them to explore and purchase products through a unified platform.",
      },
      {
        title: "2. Information We Collect",
        body: "We may collect the following information:",
        subsections: [
          {
            title: "Personal Information",
            items: ["Full name", "Phone number", "Email address", "Delivery address", "Account information"],
          },
          {
            title: "Order Information",
            items: ["Products purchased", "Order history", "Purchase amounts", "Order status"],
          },
          {
            title: "Technical Information",
            items: ["IP address", "Device type", "Operating system", "Browser data", "Cookies"],
          },
        ],
      },
      {
        title: "3. How We Use Information",
        body: "We use information to:",
        subsections: [
          {
            title: "",
            items: [
              "Create and manage user accounts",
              "Process orders and complete purchases",
              "Communicate with users about orders or technical support",
              "Improve platform performance and user experience",
              "Prevent fraud and illegal activities",
              "Send service notifications and updates",
            ],
          },
        ],
      },
      {
        title: "4. Information Sharing",
        body: [
          "Core does not sell or rent personal data to any third party.",
          "Information may be shared in the following cases:",
        ],
        subsections: [
          {
            title: "",
            items: [
              "With participating stores to fulfill orders",
              "With shipping and delivery companies to complete deliveries",
              "With electronic payment service providers to process payments",
              "If required by law or competent official authorities",
            ],
          },
        ],
      },
      {
        title: "5. Data Protection",
        body: [
          "Core is committed to taking appropriate security measures to protect data from unauthorized access, modification, disclosure, or destruction.",
          "However, 100% security of any electronic system cannot be guaranteed.",
        ],
      },
      {
        title: "6. Cookies",
        body: [
          "The platform may use cookies to improve user experience, analyze performance, and customize content and services.",
          "Users can disable cookies through browser settings, although this may affect some platform functions.",
        ],
      },
      {
        title: "7. Data Retention",
        body: "Core retains personal data for the period necessary to achieve the purposes mentioned in this policy or as required by applicable laws and regulations.",
      },
      {
        title: "8. User Rights",
        body: "Users have the right to:",
        subsections: [
          {
            title: "",
            items: [
              "Access their personal data",
              "Request correction of inaccurate data",
              "Request account deletion in accordance with applicable regulations",
              "Object to certain forms of data processing when legally available",
            ],
          },
        ],
      },
      {
        title: "9. Third-Party Links",
        body: "The platform may contain links to websites or services belonging to third parties. Core is not responsible for the privacy policies or practices of those parties.",
      },
      {
        title: "10. Privacy Policy Updates",
        body: "Core reserves the right to modify or update the Privacy Policy at any time. Any updates will be posted on this page and continued use of the platform constitutes acceptance of the changes.",
      },
      {
        title: "11. Contact Us",
        body: [
          "For any inquiries regarding the privacy policy or personal data, please contact us via:",
          "Email:\nPhone:\nWebsite:",
        ],
      },
    ],
  },
  ar: {
    title: "سياسة الخصوصية",
    updated: "آخر تحديث: 25/6/2026",
    intro:
      "مرحباً بكم في Core. نحن ملتزمون بحماية خصوصية مستخدمينا وضمان التعامل مع بياناتهم الشخصية بأعلى درجات الأمان والشفافية. توضح هذه السياسة كيفية جمع واستخدام وحماية المعلومات عند استخدام منصة Core.",
    sections: [
      {
        title: "1. من نحن",
        body: "Core هي منصة تجارة إلكترونية (Marketplace) تربط المستخدمين بالمحلات التجارية المختلفة وتتيح لهم استكشاف المنتجات وشرائها من خلال منصة موحدة.",
      },
      {
        title: "2. المعلومات التي نجمعها",
        body: "قد نقوم بجمع المعلومات التالية:",
        subsections: [
          {
            title: "المعلومات الشخصية",
            items: ["الاسم الكامل", "رقم الهاتف", "البريد الإلكتروني", "عنوان التوصيل", "معلومات الحساب"],
          },
          {
            title: "معلومات الطلبات",
            items: ["المنتجات التي يتم شراؤها", "تاريخ الطلبات", "قيمة المشتريات", "حالة الطلبات"],
          },
          {
            title: "المعلومات التقنية",
            items: ["عنوان IP", "نوع الجهاز", "نظام التشغيل", "بيانات المتصفح", "ملفات تعريف الارتباط (Cookies)"],
          },
        ],
      },
      {
        title: "3. كيفية استخدام المعلومات",
        body: "نستخدم المعلومات من أجل:",
        subsections: [
          {
            title: "",
            items: [
              "إنشاء وإدارة حساب المستخدم",
              "معالجة الطلبات وتنفيذ عمليات الشراء",
              "التواصل مع المستخدم بشأن الطلبات أو الدعم الفني",
              "تحسين أداء المنصة وتجربة المستخدم",
              "منع الاحتيال والأنشطة غير القانونية",
              "إرسال الإشعارات والتحديثات المتعلقة بالخدمة",
            ],
          },
        ],
      },
      {
        title: "4. مشاركة المعلومات",
        body: [
          "لا تقوم Core ببيع أو تأجير البيانات الشخصية لأي طرف ثالث.",
          "قد تتم مشاركة المعلومات في الحالات التالية:",
        ],
        subsections: [
          {
            title: "",
            items: [
              "مع المتاجر المشاركة لتنفيذ الطلبات",
              "مع شركات الشحن والتوصيل لإتمام عمليات التسليم",
              "مع مزودي خدمات الدفع الإلكتروني لمعالجة المدفوعات",
              "إذا كان ذلك مطلوباً بموجب القانون أو الجهات الرسمية المختصة",
            ],
          },
        ],
      },
      {
        title: "5. حماية البيانات",
        body: [
          "تلتزم Core باتخاذ التدابير الأمنية المناسبة لحماية البيانات من الوصول غير المصرح به أو التعديل أو الإفصاح أو الإتلاف.",
          "ومع ذلك، لا يمكن ضمان أمان أي نظام إلكتروني بنسبة 100%.",
        ],
      },
      {
        title: "6. ملفات تعريف الارتباط (Cookies)",
        body: [
          "قد تستخدم المنصة ملفات تعريف الارتباط لتحسين تجربة المستخدم وتحليل الأداء وتخصيص المحتوى والخدمات.",
          "يمكن للمستخدم تعطيل ملفات تعريف الارتباط من خلال إعدادات المتصفح، إلا أن ذلك قد يؤثر على بعض وظائف المنصة.",
        ],
      },
      {
        title: "7. الاحتفاظ بالبيانات",
        body: "تحتفظ Core بالبيانات الشخصية للفترة اللازمة لتحقيق الأغراض المذكورة في هذه السياسة أو وفقاً لما تتطلبه القوانين والأنظمة المعمول بها.",
      },
      {
        title: "8. حقوق المستخدم",
        body: "يحق للمستخدم:",
        subsections: [
          {
            title: "",
            items: [
              "الاطلاع على بياناته الشخصية",
              "طلب تصحيح البيانات غير الدقيقة",
              "طلب حذف الحساب وفقاً للأنظمة المعمول بها",
              "الاعتراض على بعض أشكال معالجة البيانات عندما يكون ذلك متاحاً قانونياً",
            ],
          },
        ],
      },
      {
        title: "9. روابط الجهات الخارجية",
        body: "قد تحتوي المنصة على روابط لمواقع أو خدمات تابعة لجهات خارجية. لا تتحمل Core مسؤولية سياسات الخصوصية أو ممارسات تلك الجهات.",
      },
      {
        title: "10. تحديث سياسة الخصوصية",
        body: "تحتفظ Core بحق تعديل أو تحديث سياسة الخصوصية في أي وقت. سيتم نشر أي تحديثات على هذه الصفحة ويعتبر استمرار استخدام المنصة موافقة على التعديلات.",
      },
      {
        title: "11. التواصل معنا",
        body: [
          "لأي استفسارات تتعلق بسياسة الخصوصية أو البيانات الشخصية، يرجى التواصل معنا عبر:",
          "البريد الإلكتروني:\nرقم الهاتف:\nالموقع الإلكتروني:",
        ],
      },
    ],
  },
};

export default function PrivacyPolicy() {
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
          {/* Last updated */}
          <Text
            className="mb-4 text-xs"
            style={{ color: c.muted, textAlign: isAr ? "right" : "left" }}
          >
            {content.updated}
          </Text>

          {/* Intro */}
          <View className="mb-6 rounded-xl bg-white dark:bg-bg-card p-4">
            <Text
              className="text-sm leading-6"
              style={{ color: c.secondary, textAlign: isAr ? "right" : "left" }}
            >
              {content.intro}
            </Text>
          </View>

          {/* Sections */}
          {content.sections.map((section, i) => (
            <View key={i} className="mb-4 rounded-xl bg-white dark:bg-bg-card p-4">
              <Text
                variant="bold"
                className="mb-3 text-sm text-brand dark:text-white"
                style={{ textAlign: isAr ? "right" : "left" }}
              >
                {section.title}
              </Text>

              {Array.isArray(section.body) ? (
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
              )}

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

          {/* Footer agreement */}
          <View
            className="rounded-xl p-4"
            style={{ backgroundColor: c.brandLight }}
          >
            <Text
              className="text-xs leading-5"
              style={{ color: c.secondary, textAlign: isAr ? "right" : "left" }}
            >
              {isAr
                ? "باستخدامك لمنصة Core فإنك توافق على سياسة الخصوصية هذه وعلى جمع واستخدام المعلومات وفقاً لما ورد فيها."
                : "By using the Core platform, you agree to this Privacy Policy and to the collection and use of information as described herein."}
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
