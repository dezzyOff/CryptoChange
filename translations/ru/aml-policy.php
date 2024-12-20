<?php
return [
    'rules__title' => 'AML',
    'aml_rules' => 'Политика в области ПОД/ФТ',
    'read_aml_rules' => 'Пожалуйста, ознакомьтесь с нашей AML политикой перед использованием сервиса',

    'aml_policy_intro' => 'Настоящая Политика по борьбе с отмыванием денег (далее "Политика ПОД" или "Политика") устанавливает основные принципы и процедуры, которые компания %name% ("%name%", "наш сервис", "мы", "нас") применяет для предотвращения незаконных действий и соблюдения требований законодательства в области AML (борьба с отмыванием денег) и KYC (знай своего клиента).',

    'aml_measures_title' => '1. Меры ПОД',
    'aml_measures_description' => 'Мы делаем все возможное для защиты наших клиентов от любых видов мошенничества. В связи с этим была создана интегрированная система и комплекс процедур ПОД, которые включают автоматизированный риск-ориентированный подход и регулируемые лимиты обмена.',

    'aml_system_title' => '1.1 Система ПОД',
    'aml_system_description' => 'При выявлении транзакции с высоким уровнем риска она временно блокируется, и инициируются дополнительные проверки. Пользователям, чьи транзакции приостановлены, предлагается создать аккаунт (если они действовали как гости) и пройти базовую KYC-проверку для продолжения обработки транзакции.',

    'aml_procedures_title' => '1.2 Процедуры ПОД',
    'aml_procedures_description' => 'В рамках процедур ПОД мы осуществляем проверку происхождения средств, а также удостоверяемся, что клиенты соблюдают все требования законодательства и условий нашего сервиса. Если транзакция превышает допустимый уровень риска, система может инициировать такие действия, как запрос KYC, предоставление источника средств (SOF), ручной анализ, приостановка операций, отчетность или ограничения на аккаунт.',

    'consent_guarantee_title' => '2. Гарантия согласия',
    'consent_guarantee_description' => 'Используя наш сервис, вы соглашаетесь на прохождение KYC-проверки. В рамках этих проверок мы или наши партнеры можем запросить у вас документы и информацию для подтверждения личности, происхождения средств и выполнения всех законодательных требований.',

    'consent_verification_items' => [
        'photo_id' => 'Качественное фото удостоверения личности или паспорта.',
        'user_photo' => 'Фото пользователя для сверки с предоставленным документом.',
        'real_time_check' => 'Прохождение проверки в режиме реального времени.',
        'sof_docs' => 'Документы, подтверждающие источник средств.',
    ],

    'verification_process_title' => '3. Процедура проверки',
    'verification_steps' => [
        'conduct_verification' => [
            'title' => '3.1 Проведение проверки',
            'description' => '%name% может привлекать сторонние сертифицированные компании для анализа документов и выполнения проверок. Эти компании обязаны соблюдать нашу Политику конфиденциальности и действующее законодательство о защите данных.'
        ],
        'data_storage' => [
            'title' => '3.2 Хранение данных',
            'description' => 'Все предоставленные документы хранятся с соблюдением законодательства и не передаются третьим лицам без законного запроса от компетентных органов.'
        ],
        'positive_result' => [
            'title' => '3.3 Положительный результат',
            'description' => 'Если проверка завершена успешно, транзакция будет обработана автоматически.'
        ],
        'negative_result' => [
            'title' => '3.4 Отрицательный результат',
            'description' => 'Если пользователь не прошел проверку KYC или его данные оказались в черных списках, сервис оставляет за собой право отказать в предоставлении услуг. Замороженные средства могут быть удержаны до завершения расследования или переданы властям.'
        ],
    ],

    'liability_title' => '4. Ограничение ответственности',
    'liability_description' => '%name% предпринимает меры для предотвращения незаконных действий, включая отказ от сотрудничества с лицами, связанными с отмыванием денег, финансированием терроризма или иными противоправными действиями. Мы не несем ответственности за злоупотребления нашими услугами клиентами, а также за ошибки, допущенные в ходе обнаружения подозрительных операций.',


    'any_questions' => 'Есть вопросы?',
    'read_faq_or' => 'Прочитайте раздел часто задаваемых вопросов или',
    'contact_us' => 'Свяжитесь с нами',
];