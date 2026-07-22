alter table public.events
  alter column capacity set default 10000;

-- これまで定員入力欄がなかったため、既定値20は利用者が設定した値ではない。
update public.events
set capacity = 10000
where capacity = 20;

update public.events
set category = 'EVENT'
where category = 'NEW EVENT';

update public.events
set tagline = null
where tagline = '新しいイベントが作成されました';

update public.events
set description = null
where description = 'イベントの説明はまだありません。';

update public.profiles
set city = null
where display_name = 'Test'
  and handle = '@tamasyu0202'
  and city = 'Tokyo';
