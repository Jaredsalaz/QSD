
import { motion } from 'framer-motion';
import { Shield, FileText, Lock, Users, Send, CheckSquare, Info, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="container min-h-screen py-5" style={{ display: 'block', maxWidth: '900px', margin: '0 auto' }}>
      
      <motion.button 
        className="btn-secondary"
        style={{ marginBottom: '2rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        onClick={() => navigate(-1)}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <ArrowLeft size={18} /> Volver
      </motion.button>

      <motion.div 
        className="glass-panel"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ padding: '3rem', position: 'relative', overflow: 'hidden' }}
      >
        {/* Decorative background element */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, var(--gold-opaque) 0%, transparent 70%)',
          opacity: 0.05,
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        <motion.div variants={itemVariants} style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(212,175,55,0.1)', color: 'var(--gold-opaque)', marginBottom: '1.5rem' }}>
            <Shield size={32} />
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem', letterSpacing: '-0.5px' }}>
            Aviso de Privacidad Integral
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: '1.6', maxWidth: '700px', margin: '0 auto' }}>
            <strong>Que Siga la Democracia</strong>, Agrupación Política Nacional a través del Comité Estatal de Estrategas del Cambio, con domicilio oficial en 1ª norte Oriente entre 5ª y 6ª Oriente número 760 C, Colonia Terán, Tuxtla Gutiérrez, Chiapas; y portal de internet <a href="https://qsd.com.mx/admin" style={{ color: 'var(--gold-opaque)', textDecoration: 'none' }}>https://qsd.com.mx/admin</a>, es responsable del tratamiento de sus datos personales, de conformidad con lo dispuesto en la Ley Federal de Protección de Datos Personales en Posesión de los Particulares, su reglamento y demás disposiciones aplicables.
          </p>
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          
          {/* Section 1 */}
          <motion.section variants={itemVariants}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: '1rem' }}>
              <FileText size={22} color="var(--gold-opaque)" />
              1. Datos Personales que se recaban
            </h2>
            <div style={{ background: 'rgba(0,0,0,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Para las finalidades señaladas en el presente aviso, se recaban los siguientes datos:</p>
              <ul style={{ color: 'var(--text-main)', listStyle: 'none', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                <li>• Nombre completo</li>
                <li>• Domicilio</li>
                <li>• Número telefónico</li>
                <li>• Correo electrónico</li>
                <li>• Información laboral</li>
                <li>• Copia de identificación oficial</li>
              </ul>
              <p style={{ color: 'var(--text-muted)', marginTop: '1rem', marginBottom: '0.5rem' }}>Así mismo, se recabarán datos personales sensibles, tales como:</p>
              <ul style={{ color: 'var(--text-main)', listStyle: 'none', padding: 0 }}>
                <li>• Informes sobre afinidad, trayectoria o participación política (semblanza política)</li>
              </ul>
            </div>
          </motion.section>

          {/* Section 2 */}
          <motion.section variants={itemVariants}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: '1rem' }}>
              <Users size={22} color="var(--gold-opaque)" />
              2. Finalidades del tratamiento de los datos
            </h2>
            <div style={{ color: 'var(--text-muted)', lineHeight: '1.7' }}>
              <p style={{ marginBottom: '1rem' }}>Sus datos personales serán utilizados para las siguientes finalidades:</p>
              <ul style={{ paddingLeft: '1.5rem' }}>
                <li>Integración, registro y actualización del partido a nivel local.</li>
                <li>Análisis del crecimiento organizacional y político.</li>
                <li>Identificación de perfiles para participación interna.</li>
                <li>Comunicación institucional y organizativa.</li>
                <li>Planeación de estrategias político-electorales.</li>
              </ul>
            </div>
          </motion.section>

          {/* Section 3 */}
          <motion.section variants={itemVariants}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: '1rem' }}>
              <Lock size={22} color="var(--gold-opaque)" />
              3. Uso de datos personales sensibles
            </h2>
            <div style={{ color: 'var(--text-muted)', lineHeight: '1.7' }}>
              <p>
                Se hace de su conocimiento que los datos personales sensibles serán tratados con un estándar reforzado de confidencialidad y recabaremos su consentimiento expreso cuando sea necesario.
              </p>
              <p style={{ marginTop: '1rem' }}>
                Si usted no desea que sus datos sean tratados para estas finalidades, podrá manifestarlo desde este momento enviando un correo a <a href="mailto:qsd@qsd.com.mx" style={{ color: 'var(--gold-opaque)' }}>qsd@qsd.com.mx</a> con el asunto: <strong>"No consiento las finalidades del tratamiento de datos personales"</strong>. Sin embargo, el hecho de que una persona manifieste su interés en registrarse, participar o integrarse a una organización con actividad política puede llegar a vincularse con información relacionada con opiniones o afinidades políticas, categoría que la ley considera sensible.
              </p>
            </div>
          </motion.section>

          {/* Section 4 */}
          <motion.section variants={itemVariants}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: '1rem' }}>
              <CheckSquare size={22} color="var(--gold-opaque)" />
              4. Consentimiento
            </h2>
            <div style={{ color: 'var(--text-muted)', lineHeight: '1.7' }}>
              <p>
                Al proporcionar sus datos personales mediante la ficha descriptiva o el formulario del sitio web y aceptar el presente aviso de privacidad, usted consiente su tratamiento para las finalidades antes señaladas. Cuando el tratamiento involucre datos sensibles, o cuando legalmente resulte exigible, Que Siga la Democracia recabará su consentimiento expreso mediante mecanismos electrónicos, casillas de aceptación, firma o cualquier otro medio válido conforme a la ley.
              </p>
            </div>
          </motion.section>

          {/* Section 5 */}
          <motion.section variants={itemVariants}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: '1rem' }}>
              <Send size={22} color="var(--gold-opaque)" />
              5. Transferencia de datos
            </h2>
            <div style={{ color: 'var(--text-muted)', lineHeight: '1.7' }}>
              <p style={{ marginBottom: '1rem' }}>Sus datos personales podrán ser compartidos únicamente:</p>
              <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                <li>Con órganos internos del partido político a nivel local y federal.</li>
                <li>Con autoridades electorales competentes, cuando así lo establezca la ley o sea requerido.</li>
              </ul>
              <div style={{ padding: '1rem', borderLeft: '3px solid var(--gold-opaque)', background: 'rgba(212,175,55,0.05)', borderRadius: '0 8px 8px 0' }}>
                En ningún caso se comercializará o transferirá su información a terceros ajenos sin su consentimiento.
              </div>
            </div>
          </motion.section>

          {/* Section 6 */}
          <motion.section variants={itemVariants}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: '1rem' }}>
              <Info size={22} color="var(--gold-opaque)" />
              6. Derechos ARCO
            </h2>
            <div style={{ color: 'var(--text-muted)', lineHeight: '1.7' }}>
              <p style={{ marginBottom: '1rem' }}>Usted tiene derecho a:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                {['Acceder a sus datos personales', 'Rectificarlos en caso de ser inexactos', 'Cancelarlos cuando no sean necesarios', 'Oponerse al tratamiento de los mismos'].map((item, i) => (
                  <span key={i} style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    {item}
                  </span>
                ))}
              </div>
              <p>
                Para ejercer estos derechos, deberá enviar una solicitud al correo <a href="mailto:qsd@qsd.com.mx" style={{ color: 'var(--gold-opaque)' }}>qsd@qsd.com.mx</a> o acudir al 1ª norte Oriente entre 5ª y 6ª Oriente número 760 C, Colonia Terán, Tuxtla Gutiérrez, Chiapas.
              </p>
            </div>
          </motion.section>

          {/* Section 7 & 8 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <motion.section variants={itemVariants}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '1rem' }}>
                7. Medidas de seguridad
              </h2>
              <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '0.95rem' }}>
                El responsable implementa medidas de seguridad administrativas, técnicas y físicas para proteger sus datos personales contra daño, perdida, alteración, destrucción o uso no autorizado.
              </p>
            </motion.section>

            <motion.section variants={itemVariants}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '1rem' }}>
                8. Cambios al aviso
              </h2>
              <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '0.95rem' }}>
                El presente aviso podrá ser modificado en cualquier momento. Las modificaciones estarán disponibles en <a href="https://qsd.com.mx/admin" style={{ color: 'var(--gold-opaque)' }}>https://qsd.com.mx/admin</a>
              </p>
            </motion.section>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default PrivacyPolicy;
