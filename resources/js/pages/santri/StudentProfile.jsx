import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStudentPortal } from "../../components/useStudentPortal";
import { getRegistrationProfile, saveRegistrationProfile } from "../../service/registrationService";

const sections = [
  {
    title: "Data Calon Santri",
    wide: true,
    fields: [
      ["namaLengkap", "Nama Lengkap (Sesuai Akta)", "text"],
      ["namaPanggilan", "Nama Panggilan", "text"],
      ["tempatLahir", "Tempat Lahir", "text"],
      ["tanggalLahir", "Tanggal Lahir", "date"],
      ["jenisKelamin", "Jenis Kelamin", "select", [["", "Pilih"], ["L", "Laki-laki"], ["P", "Perempuan"]]],
      ["golonganDarah", "Golongan Darah", "select", ["", "A", "B", "AB", "O"]],
      ["jumlahSaudara", "Jumlah Saudara", "number"],
      ["anakKe", "Anak Ke-", "number"],
      ["alamat", "Alamat / Domisili Anak", "textarea", "full"],
    ],
  },
  {
    title: "Data Sekolah Asal Calon Santri",
    wide: true,
    fields: [
      ["nisn", "NISN", "text"],
      ["tahunLulus", "Tahun Lulus", "number"],
      ["namaSekolah", "Nama Sekolah", "text"],
      ["alamatSekolah", "Alamat Sekolah", "text"],
      ["kotaSekolah", "Kota / Kabupaten", "text"],
      ["provinsiSekolah", "Provinsi", "text"],
    ],
  },
  {
    title: "A. Data Ayah",
    fields: [
      ["namaAyah", "Nama Lengkap", "text"],
      ["tempatLahirAyah", "Tempat Lahir", "text"],
      ["tanggalLahirAyah", "Tanggal Lahir", "date"],
      ["pekerjaanAyah", "Pekerjaan", "text"],
      ["pendidikanAyah", "Pendidikan Terakhir", "select", ["", "SD", "SMP", "SMA", "D3", "S1", "S2", "S3"]],
      ["penghasilanAyah", "Penghasilan Per Bulan", "number"],
      ["alamatAyah", "Alamat Ayah", "textarea", "full"],
      ["desaAyah", "Desa", "text"],
      ["kecamatanAyah", "Kecamatan", "text"],
      ["kotaAyah", "Kota / Kabupaten", "text"],
      ["provinsiAyah", "Provinsi", "text"],
      ["hpAyah", "Telepon / HP Ayah", "tel"],
    ],
  },
  {
    title: "B. Data Ibu",
    fields: [
      ["namaIbu", "Nama Lengkap", "text"],
      ["tempatLahirIbu", "Tempat Lahir", "text"],
      ["tanggalLahirIbu", "Tanggal Lahir", "date"],
      ["pekerjaanIbu", "Pekerjaan", "text"],
      ["pendidikanIbu", "Pendidikan Terakhir", "select", ["", "SD", "SMP", "SMA", "D3", "S1", "S2", "S3"]],
      ["penghasilanIbu", "Penghasilan Per Bulan", "number"],
      ["alamatIbu", "Alamat Ibu", "textarea", "full"],
      ["desaIbu", "Desa", "text"],
      ["kecamatanIbu", "Kecamatan", "text"],
      ["kotaIbu", "Kota / Kabupaten", "text"],
      ["provinsiIbu", "Provinsi", "text"],
      ["hpIbu", "Telepon / HP Ibu", "tel"],
      ["hpPondokIbu", "Nomor HP Untuk WA Resmi Pesantren", "tel"],
    ],
  },
  {
    title: "Data Wali (Opsional)",
    wide: true,
    dashed: true,
    fields: [
      ["namaWali", "Nama Lengkap Wali", "text"],
      ["tempatLahirWali", "Tempat Lahir", "text"],
      ["tanggalLahirWali", "Tanggal Lahir", "date"],
      ["pekerjaanWali", "Pekerjaan", "text"],
      ["pendidikanWali", "Pendidikan Terakhir", "select", ["", "SD", "SMP", "SMA", "D3", "S1", "S2", "S3"]],
      ["alamatWali", "Alamat Wali", "textarea", "full"],
      ["desaWali", "Desa", "text"],
      ["kecamatanWali", "Kecamatan", "text"],
      ["kotaWali", "Kota / Kabupaten", "text"],
      ["provinsiWali", "Provinsi", "text"],
      ["hpWaliTambahan", "Telepon / HP Wali", "tel"],
      ["hubunganWali", "Hubungan Dengan Santri", "text"],
    ],
  },
];

function ProfileField({ field, value, onChange }) {
  const [name, label, type, optionOrFull] = field;
  const isFull = optionOrFull === "full";
  const options = Array.isArray(optionOrFull) ? optionOrFull : null;

  return (
    <label className={isFull || type === "textarea" ? "is-full" : ""}>
      <span>{label}</span>
      {type === "select" ? (
        <select value={value || ""} onChange={(event) => onChange(name, event.target.value)}>
          {options.map((option) => {
            const value = Array.isArray(option) ? option[0] : option;
            const text = Array.isArray(option) ? option[1] : option || "Pilih";
            return <option value={value} key={value}>{text}</option>;
          })}
        </select>
      ) : type === "textarea" ? (
        <textarea value={value || ""} placeholder="Isi data di sini" onChange={(event) => onChange(name, event.target.value)} />
      ) : (
        <input type={type} value={value || ""} placeholder="Isi data di sini" onChange={(event) => onChange(name, event.target.value)} />
      )}
    </label>
  );
}

export default function StudentProfile() {
  const navigate = useNavigate();
  const { profile, updateProfile, progress } = useStudentPortal();
  const [form, setForm] = useState(profile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback((shouldApply = () => true) => {
    setLoading(true);
    return getRegistrationProfile()
      .then((savedProfile) => {
        if (!shouldApply()) return;
        let nextProfile = null;
        setForm((current) => {
          nextProfile = { ...current, ...savedProfile };
          return nextProfile;
        });
        updateProfile(nextProfile);
      })
      .catch((error) => {
        if (!shouldApply()) return;
        console.warn("Gagal mengambil profil backend:", error);
      })
      .finally(() => {
        if (!shouldApply()) return;
        setLoading(false);
      });
  }, [updateProfile]);

  useEffect(() => {
    let active = true;

    loadProfile(() => active);

    return () => {
      active = false;
    };
  }, [loadProfile]);

  const setField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const savedProfile = await saveRegistrationProfile(form);
      const nextProfile = { ...form, ...savedProfile };
      setForm(nextProfile);
      updateProfile(nextProfile);
      alert("Data profil berhasil disimpan ke backend.");
      return true;
    } catch (error) {
      alert(error.message || "Data profil gagal disimpan.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="student-page">
      <div className="student-page-title">
        <h1>Profil Santri</h1>
        <p>Isi data calon santri sesuai field yang dibutuhkan backend.</p>
      </div>

      {loading && <div className="student-note">Mengambil data profil dari backend...</div>}

      <div className="profile-grid">
        {sections.map((section) => (
          <article
            className={`profile-section${section.wide ? " profile-section--wide" : ""}${section.dashed ? " profile-section--dashed" : ""}`}
            key={section.title}
          >
            <h2>{section.title}</h2>
            <div className="profile-fields">
              {section.fields.map((field) => (
                <ProfileField
                  field={field}
                  key={field[0]}
                  value={form[field[0]]}
                  onChange={setField}
                />
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="student-note">
        Data profil disimpan ke backend melalui endpoint calon santri, sekolah asal, ayah, ibu, dan wali.
      </div>
      <div className="student-action-row">
        <button className="student-secondary-action" type="button" onClick={() => navigate("/santri/dashboard")}>Kembali</button>
        <button className="student-primary-action" type="button" onClick={handleSave} disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
        <button
          className="student-primary-action"
          type="button"
          disabled={saving}
          onClick={async () => {
            const saved = await handleSave();
            if (saved) navigate("/santri/dokumen");
          }}
        >
          {progress.profileComplete ? "Lanjut Upload" : "Simpan & Lanjut"}
        </button>
      </div>
    </section>
  );
}
